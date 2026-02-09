const User = require('../models/User');
const firebaseService = require('../services/firebaseService');
const { isPermanentAdmin } = require('../config/admin');

/**
 * User Controller
 * Handles user-related operations with MongoDB and Firebase
 */

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    // User data is attached by auth middleware
    if (!req.userData) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: req.userData.toPublicProfile()
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user profile'
    });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user'
    });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    
    // Build query
    const query = {};
    if (role) query.role = role;
    
    const users = await User.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        users: users.map(user => user.toPublicProfile()),
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { profile } = req.body;
    const user = req.userData;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update profile fields
    if (profile) {
      if (profile.firstName) user.profile.firstName = profile.firstName;
      if (profile.lastName) user.profile.lastName = profile.lastName;
      if (profile.bio) user.profile.bio = profile.bio;
      if (profile.dateOfBirth) user.profile.dateOfBirth = profile.dateOfBirth;
      if (profile.address) user.profile.address = { ...user.profile.address, ...profile.address };
    }

    await user.save();

    // Also update Firebase user if needed
    if (req.body.displayName || req.body.photoURL) {
      await firebaseService.updateUser(req.user.uid, {
        displayName: req.body.displayName,
        photoURL: req.body.photoURL
      });
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role'
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent changing permanent admin's role
    if (isPermanentAdmin(user.email)) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot change role of permanent admin'
      });
    }

    user.role = role;
    await user.save();

    // Update Firebase custom claims
    await firebaseService.setCustomUserClaims(user.firebaseUid, { role });

    res.json({
      status: 'success',
      message: 'User role updated successfully',
      data: user.toPublicProfile()
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user role'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent deleting permanent admin
    if (isPermanentAdmin(user.email)) {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot delete permanent admin'
      });
    }

    // Delete from Firebase
    await firebaseService.deleteUser(user.firebaseUid);

    // Delete from MongoDB
    await User.findByIdAndDelete(id);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
};

// Search users
const searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const users = await User.find({
      $or: [
        { email: searchRegex },
        { displayName: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex }
      ]
    })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

    const count = await User.countDocuments({
      $or: [
        { email: searchRegex },
        { displayName: searchRegex },
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex }
      ]
    });

    res.json({
      status: 'success',
      data: {
        users: users.map(user => user.toPublicProfile()),
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        total: count
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error searching users'
    });
  }
};

// Update user subscription
const updateSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, status, startDate, endDate } = req.body;
    const user = req.userData;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update subscription fields
    if (plan) user.subscription.plan = plan;
    if (billingCycle) user.subscription.billingCycle = billingCycle;
    if (status) user.subscription.status = status;
    if (startDate) user.subscription.startDate = new Date(startDate);
    if (endDate) user.subscription.endDate = new Date(endDate);

    await user.save();

    res.json({
      status: 'success',
      message: 'Subscription updated successfully',
      data: {
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating subscription'
    });
  }
};

// Start free trial
const startTrial = async (req, res) => {
  try {
    const user = req.userData;
    const TRIAL_DAYS = 7;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user already has an active trial or subscription
    if (user.subscription.status === 'trial' && user.subscription.trialEnd > new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Trial already active'
      });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    user.subscription = {
      plan: 'trial',
      status: 'trial',
      trialStart: now,
      trialEnd: trialEnd,
      billingCycle: 'monthly'
    };

    await user.save();

    res.json({
      status: 'success',
      message: 'Trial started successfully',
      data: {
        subscription: user.subscription,
        trialDays: TRIAL_DAYS,
        trialEnd: trialEnd
      }
    });
  } catch (error) {
    console.error('Start trial error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error starting trial'
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const user = req.userData;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    user.subscription.status = 'cancelled';
    await user.save();

    res.json({
      status: 'success',
      message: 'Subscription cancelled successfully',
      data: {
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error cancelling subscription'
    });
  }
};

// Get watch history
const getWatchHistory = async (req, res) => {
  try {
    const user = req.userData;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const watchHistory = user.getWatchHistory();

    res.json({
      status: 'success',
      data: {
        watchHistory,
        total: watchHistory.length
      }
    });
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching watch history'
    });
  }
};

// Add to watch history
const addToWatchHistory = async (req, res) => {
  try {
    const user = req.userData;
    const { movieId, title, posterPath, genres, duration, voteAverage } = req.body;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!movieId || !title) {
      return res.status(400).json({
        status: 'error',
        message: 'Movie ID and title are required'
      });
    }

    await user.addToWatchHistory({
      movieId,
      title,
      posterPath,
      genres,
      duration,
      voteAverage
    });

    res.json({
      status: 'success',
      message: 'Added to watch history',
      data: {
        watchHistory: user.getWatchHistory()
      }
    });
  } catch (error) {
    console.error('Add to watch history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error adding to watch history'
    });
  }
};

// Clear watch history
const clearWatchHistory = async (req, res) => {
  try {
    const user = req.userData;

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    await user.clearWatchHistory();

    res.json({
      status: 'success',
      message: 'Watch history cleared successfully',
      data: {
        watchHistory: []
      }
    });
  } catch (error) {
    console.error('Clear watch history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error clearing watch history'
    });
  }
};

module.exports = {

  getCurrentUser,
  getUserById,
  getAllUsers,
  updateProfile,
  updateUserRole,
  deleteUser,
  searchUsers,
  updateSubscription,
  startTrial,
  cancelSubscription,
  getWatchHistory,
  addToWatchHistory,
  clearWatchHistory
};
