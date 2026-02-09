const { getAuth } = require('../config/firebase');
const User = require('../models/User');
const { isPermanentAdmin } = require('../config/admin');

/**
 * Verify Firebase ID Token middleware
 * This middleware verifies the Firebase ID token from the Authorization header
 * and attaches the decoded user information to the request object
 */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided or invalid token format'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token found'
      });
    }

    // Verify the ID token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Attach decoded user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      firebase: decodedToken
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked'
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const idToken = authHeader.split('Bearer ')[1];
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      firebase: decodedToken
    };

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Check if user has required role
 * Must be used after verifyFirebaseToken
 * Permanent admins (ghildiyalnitin2007@gmail.com) always have admin access
 */
const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      // Check if user is a permanent admin
      if (isPermanentAdmin(req.user.email)) {
        // Permanent admins always have access
        const user = await User.findByFirebaseUid(req.user.uid);
        if (user) {
          req.userData = user;
        }
        return next();
      }

      // Find user in MongoDB to check role
      const user = await User.findByFirebaseUid(req.user.uid);
      
      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found in database'
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      // Attach full user data to request
      req.userData = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking user permissions'
      });
    }
  };
};

/**
 * Sync Firebase user with MongoDB
 * Creates or updates user in MongoDB based on Firebase auth data
 * Permanent admins are automatically assigned 'admin' role
 */
const syncUserWithMongoDB = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      console.log('syncUserWithMongoDB: No user data in request');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No user data available'
      });
    }

    console.log('syncUserWithMongoDB: Syncing user:', req.user.uid, req.user.email);
    
    let user = await User.findByFirebaseUid(req.user.uid);
    const isAdmin = isPermanentAdmin(req.user.email);

    if (!user) {
      // Check if user exists with same email but different Firebase UID
      const existingUserByEmail = await User.findByEmail(req.user.email);
      
      if (existingUserByEmail) {
        console.log('syncUserWithMongoDB: Found existing user by email, updating Firebase UID');
        // Update the existing user with the new Firebase UID
        user = existingUserByEmail;
        user.firebaseUid = req.user.uid;
      } else {
        console.log('syncUserWithMongoDB: Creating new user');
        // Create new user
        user = new User({
          firebaseUid: req.user.uid,
          email: req.user.email || 'no-email@example.com',
          displayName: req.user.name || req.user.email?.split('@')[0] || 'User',
          photoURL: req.user.picture || null,
          isEmailVerified: req.user.emailVerified || false,
          role: isAdmin ? 'admin' : 'user',
          lastLoginAt: new Date()
        });
      }
    } else {
      console.log('syncUserWithMongoDB: Updating existing user');
      // Update existing user
      user.lastLoginAt = new Date();
      if (req.user.email) user.email = req.user.email;
      if (req.user.name) user.displayName = req.user.name;
      if (req.user.picture) user.photoURL = req.user.picture;
      if (req.user.emailVerified !== undefined) user.isEmailVerified = req.user.emailVerified;
      
      // Ensure permanent admin always has admin role
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
    }

    try {
      await user.save();
      console.log('syncUserWithMongoDB: User saved successfully:', user._id);
      req.userData = user;
      next();
    } catch (saveError) {
      console.error('User save error:', saveError);

      // Handle specific MongoDB errors
      if (saveError.code === 11000) {
        // Duplicate key error
        console.error('Duplicate key error - user may already exist with different data');
        return res.status(409).json({
          error: 'Conflict',
          message: 'User data conflict - please contact support'
        });
      }

      if (saveError.name === 'ValidationError') {
        console.error('Validation error:', saveError.message);
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid user data: ' + saveError.message
        });
      }

      // Generic error
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to save user to database: ' + saveError.message
      });
    }
  } catch (error) {
    console.error('User sync error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync user with database'
    });
  }
};



module.exports = {
  verifyFirebaseToken,
  authenticate: verifyFirebaseToken, // Alias for compatibility
  optionalAuth,
  requireRole,
  syncUserWithMongoDB
};
