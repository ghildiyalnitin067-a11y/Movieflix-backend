const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const profileController = require('../controllers/profileController');

// All profile routes require authentication
router.use(authenticate);

// Get all profiles for current user
router.get('/', profileController.getProfiles);

// Get profile limits
router.get('/limits', profileController.getProfileLimits);

// Get default avatars
router.get('/avatars', profileController.getDefaultAvatars);

// Get current active profile
router.get('/active', profileController.getActiveProfile);

// Create new profile
router.post('/', profileController.createProfile);

// Get specific profile
router.get('/:id', profileController.getProfileById);

// Update profile
router.put('/:id', profileController.updateProfile);

// Delete profile
router.delete('/:id', profileController.deleteProfile);

// Switch to profile
router.post('/:id/switch', profileController.switchProfile);

// Get profile's watch history
router.get('/:id/history', profileController.getWatchHistory);

// Add to watch history
router.post('/:id/history', profileController.addToWatchHistory);

// Get continue watching list
router.get('/:id/continue-watching', profileController.getContinueWatching);

// Get profile's my list
router.get('/:id/mylist', profileController.getMyList);

// Add to my list
router.post('/:id/mylist', profileController.addToMyList);

// Remove from my list
router.delete('/:id/mylist/:contentId', profileController.removeFromMyList);

module.exports = router;
