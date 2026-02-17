const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getAuth } = require('../config/firebase');
const { verifyFirebaseToken } = require('../middleware/auth');
const User = require('../models/User');
const { isPermanentAdmin } = require('../config/admin');

const FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

if (!FIREBASE_API_KEY) {
  console.error('⚠️ FIREBASE_API_KEY is not configured in environment variables');
}

// Email/Password Sign In
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    if (!FIREBASE_API_KEY) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Server configuration error: FIREBASE_API_KEY not set'
      });
    }

    const response = await axios.post(
      `${FIREBASE_AUTH_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );

    const { idToken, refreshToken, expiresIn, localId } = response.data;

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    const isAdmin = isPermanentAdmin(decodedToken.email);
    
    let user = await User.findByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      const existingUserByEmail = await User.findByEmail(decodedToken.email);
      
      if (existingUserByEmail) {
        user = existingUserByEmail;
        user.firebaseUid = decodedToken.uid;
      } else {
        user = new User({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || 'no-email@example.com',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decodedToken.picture || null,
          isEmailVerified: decodedToken.email_verified || false,
          role: isAdmin ? 'admin' : 'user',
          lastLoginAt: new Date()
        });
      }
    } else {
      user.lastLoginAt = new Date();
      if (decodedToken.email) user.email = decodedToken.email;
      if (decodedToken.name) user.displayName = decodedToken.name;
      if (decodedToken.picture) user.photoURL = decodedToken.picture;
      if (decodedToken.emailVerified !== undefined) user.isEmailVerified = decodedToken.email_verified;
      
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
    }

    await user.save();

    res.json({
      success: true,
      data: {
        idToken,
        refreshToken,
        expiresIn: parseInt(expiresIn),
        user: {
          uid: localId,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          role: user.role
        },
        userData: user.toPublicProfile()
      }
    });
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);

    if (error.response?.data?.error) {
      const firebaseError = error.response.data.error;
      return res.status(400).json({
        error: 'Authentication Failed',
        message: firebaseError.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
});

// Email/Password Sign Up
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    const response = await axios.post(
      `${FIREBASE_AUTH_URL}:signUp?key=${FIREBASE_API_KEY}`,
      {
        email,
        password,
        displayName,
        returnSecureToken: true
      }
    );

    const { idToken, refreshToken, expiresIn, localId } = response.data;

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    const isAdmin = isPermanentAdmin(decodedToken.email);
    
    let user = await User.findByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      const existingUserByEmail = await User.findByEmail(decodedToken.email);
      
      if (existingUserByEmail) {
        user = existingUserByEmail;
        user.firebaseUid = decodedToken.uid;
      } else {
        user = new User({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || 'no-email@example.com',
          displayName: decodedToken.name || displayName || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decodedToken.picture || null,
          isEmailVerified: decodedToken.email_verified || false,
          role: isAdmin ? 'admin' : 'user',
          lastLoginAt: new Date()
        });
      }
    } else {
      user.lastLoginAt = new Date();
      if (decodedToken.email) user.email = decodedToken.email;
      if (decodedToken.name) user.displayName = decodedToken.name;
      if (displayName && !decodedToken.name) user.displayName = displayName;
      if (decodedToken.picture) user.photoURL = decodedToken.picture;
      if (decodedToken.emailVerified !== undefined) user.isEmailVerified = decodedToken.email_verified;
      
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
    }

    await user.save();

    res.status(201).json({
      success: true,
      data: {
        idToken,
        refreshToken,
        expiresIn: parseInt(expiresIn),
        user: {
          uid: localId,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          displayName: decodedToken.name || displayName,
          photoURL: decodedToken.picture,
          role: user.role
        },
        userData: user.toPublicProfile()
      }
    });
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message);

    if (error.response?.data?.error) {
      const firebaseError = error.response.data.error;
      return res.status(400).json({
        error: 'Registration Failed',
        message: firebaseError.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required'
      });
    }

    if (!FIREBASE_API_KEY) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Server configuration error: FIREBASE_API_KEY not set'
      });
    }

    const response = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    );

    const { id_token, refresh_token, expires_in, user_id } = response.data;

    res.json({
      success: true,
      data: {
        idToken: id_token,
        refreshToken: refresh_token,
        expiresIn: parseInt(expires_in),
        userId: user_id
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error.response?.data || error.message);

    if (error.response?.data?.error) {
      const firebaseError = error.response.data.error;
      
      if (firebaseError.message === 'INVALID_REFRESH_TOKEN' || 
          firebaseError.status === 'INVALID_ARGUMENT') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token. Please sign in again.',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      if (firebaseError.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Refresh token has expired. Please sign in again.',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (firebaseError.message === 'USER_DISABLED') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User account has been disabled.',
          code: 'USER_DISABLED'
        });
      }

      if (firebaseError.message === 'USER_NOT_FOUND') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found. Please sign in again.',
          code: 'USER_NOT_FOUND'
        });
      }

      return res.status(400).json({
        error: 'Authentication Failed',
        message: firebaseError.message,
        code: firebaseError.status || 'UNKNOWN_ERROR'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed'
    });
  }
});

// Google Sign In
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;

    console.log('🔍 Google login attempt received');

    if (!idToken) {
      console.error('❌ Google login failed: No ID token provided');
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Google ID token is required'
      });
    }

    // Log token length for debugging (don't log the actual token)
    console.log(`🔑 ID Token received (length: ${idToken.length})`);

    const auth = getAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log(`✅ Token verified for user: ${decodedToken.uid}`);
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError.code, verifyError.message);
      throw verifyError;
    }

    const isAdmin = isPermanentAdmin(decodedToken.email);
    console.log(`👤 User email: ${decodedToken.email}, Admin: ${isAdmin}`);
    
    let user = await User.findByFirebaseUid(decodedToken.uid);
    
    if (!user) {
      console.log('🆕 New user, creating account...');
      const existingUserByEmail = await User.findByEmail(decodedToken.email);
      
      if (existingUserByEmail) {
        console.log('🔗 Linking existing user by email to Firebase UID');
        user = existingUserByEmail;
        user.firebaseUid = decodedToken.uid;
      } else {
        user = new User({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email || 'no-email@example.com',
          displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          photoURL: decodedToken.picture || null,
          isEmailVerified: decodedToken.email_verified || false,
          role: isAdmin ? 'admin' : 'user',
          lastLoginAt: new Date()
        });
      }
    } else {
      console.log('🔄 Existing user, updating login time...');
      user.lastLoginAt = new Date();
      if (decodedToken.email) user.email = decodedToken.email;
      if (decodedToken.name) user.displayName = decodedToken.name;
      if (decodedToken.picture) user.photoURL = decodedToken.picture;
      if (decodedToken.emailVerified !== undefined) user.isEmailVerified = decodedToken.email_verified;
      
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
    }

    await user.save();
    console.log('💾 User saved to database');

    // Generate a custom token that can be used to get a refresh token
    let customToken;
    try {
      customToken = await auth.createCustomToken(decodedToken.uid);
      console.log('🔐 Custom token created successfully');
    } catch (customTokenError) {
      console.error('❌ Failed to create custom token:', customTokenError.message);
      // Continue without custom token - idToken is still valid
      customToken = null;
    }

    // Google Sign-In doesn't provide a refresh token, so we use the idToken
    // The frontend should handle token refresh by re-authenticating with Google
    // or we can provide a custom token that can be exchanged
    const expiresIn = 3600; // 1 hour in seconds (standard Firebase ID token expiry)

    res.json({
      success: true,
      data: {
        idToken,
        refreshToken: idToken, // Use idToken as refreshToken for Google sign-in
        customToken,
        expiresIn,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          displayName: decodedToken.name,
          photoURL: decodedToken.picture,
          role: user.role
        },
        userData: user.toPublicProfile()
      }
    });
    console.log('✅ Google login successful');
  } catch (error) {
    console.error('❌ Google login error:', error.code, error.message);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/argument-error') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid ID token format. Please sign in again.',
        code: error.code
      });
    }
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'ID token has expired. Please sign in again.',
        code: error.code
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid ID token. Please sign in again.',
        code: error.code
      });
    }

    if (error.code === 'auth/invalid-credential') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid credentials. Please sign in again.',
        code: error.code
      });
    }

    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found in Firebase.',
        code: error.code
      });
    }

    if (error.code === 'auth/project-not-found') {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Firebase project configuration error. Please contact support.',
        code: error.code
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Google login failed',
      code: error.code || 'unknown_error'
    });
  }
});


// Create custom token for authenticated users
router.post('/custom-token', verifyFirebaseToken, async (req, res) => {
  try {
    const auth = getAuth();
    const customToken = await auth.createCustomToken(req.user.uid);

    res.json({
      success: true,
      data: {
        customToken
      }
    });
  } catch (error) {
    console.error('Custom token creation error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create custom token'
    });
  }
});

module.exports = router;
