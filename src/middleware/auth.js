const { getAuth } = require('../config/firebase');
const User = require('../models/User');
const { isPermanentAdmin } = require('../config/admin');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    console.log(`🔐 Auth middleware: ${req.method} ${req.path}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No Bearer token provided');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided or invalid token format'
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      console.log('❌ Token is empty after Bearer');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token found'
      });
    }

    // Log token length for debugging (don't log the actual token)
    console.log(`🔑 Token received (length: ${idToken.length})`);

    const auth = getAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
      console.log(`✅ Token verified for user: ${decodedToken.uid}`);
    } catch (verifyError) {
      console.error('❌ Token verification failed:', verifyError.code, verifyError.message);
      throw verifyError;
    }
    
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
    console.error('❌ Auth middleware error:', error.code, error.message);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
        code: error.code
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked',
        code: error.code
      });
    }

    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid ID token format',
        code: error.code
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token argument',
        code: error.code
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
      code: error.code || 'unknown_error'
    });
  }
};


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
    next();
  }
};

const requireRole = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      let user = req.userData;

      if (!user) {
        if (isPermanentAdmin(req.user.email)) {
          user = await User.findByFirebaseUid(req.user.uid);
          if (user) {
            req.userData = user;
          }
          return next();
        }

        user = await User.findByFirebaseUid(req.user.uid);
        
        if (!user) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'User not found in database'
          });
        }
      }

      if (isPermanentAdmin(req.user.email)) {
        req.userData = user;
        return next();
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      req.userData = user;
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking user permissions'
      });
    }
  };
};

const syncUserWithMongoDB = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No user data available'
      });
    }

    let user = await User.findByFirebaseUid(req.user.uid);
    const isAdmin = isPermanentAdmin(req.user.email);

    if (!user) {
      const existingUserByEmail = await User.findByEmail(req.user.email);
      
      if (existingUserByEmail) {
        user = existingUserByEmail;
        user.firebaseUid = req.user.uid;
      } else {
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
      user.lastLoginAt = new Date();
      if (req.user.email) user.email = req.user.email;
      if (req.user.name) user.displayName = req.user.name;
      if (req.user.picture) user.photoURL = req.user.picture;
      if (req.user.emailVerified !== undefined) user.isEmailVerified = req.user.emailVerified;
      
      if (isAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
    }

    try {
      await user.save();
      req.userData = user;
      next();
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User data conflict - please contact support'
        });
      }

      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid user data: ' + saveError.message
        });
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to save user to database: ' + saveError.message
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sync user with database'
    });
  }
};

module.exports = {
  verifyFirebaseToken,
  authenticate: verifyFirebaseToken,
  optionalAuth,
  requireRole,
  syncUserWithMongoDB
};
