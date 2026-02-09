const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyFirebaseToken, syncUserWithMongoDB, requireRole } = require('../middleware/auth');

// All user routes require authentication
router.use(verifyFirebaseToken);
router.use(syncUserWithMongoDB);

// Get current user profile
router.get('/me', userController.getCurrentUser);

// Update current user profile
router.put('/me', userController.updateProfile);

// Subscription routes
router.post('/subscription', userController.updateSubscription);
router.post('/trial', userController.startTrial);
router.post('/cancel', userController.cancelSubscription);

// Search users
router.get('/search', userController.searchUsers);

// Watch history routes
router.get('/watch-history', userController.getWatchHistory);
router.post('/watch-history', userController.addToWatchHistory);
router.delete('/watch-history', userController.clearWatchHistory);

// Admin only routes

router.get('/', requireRole('admin', 'moderator'), userController.getAllUsers);
router.get('/:id', requireRole('admin', 'moderator'), userController.getUserById);
router.put('/:id/role', requireRole('admin'), userController.updateUserRole);
router.delete('/:id', requireRole('admin'), userController.deleteUser);

module.exports = router;
