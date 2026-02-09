const express = require('express');
const router = express.Router();
const watchHistoryController = require('../controllers/watchHistoryController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');

// All watch history routes require authentication
router.use(verifyFirebaseToken);

// Get current user's watch history
router.get('/', watchHistoryController.getWatchHistory);

// Add to watch history
router.post('/', watchHistoryController.addToWatchHistory);

// Clear watch history
router.delete('/', watchHistoryController.clearWatchHistory);

// Admin route - get any user's watch history
router.get('/user/:userId', requireRole('admin', 'moderator'), watchHistoryController.getUserWatchHistory);

module.exports = router;
