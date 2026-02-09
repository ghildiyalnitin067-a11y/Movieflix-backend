const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, syncUserWithMongoDB } = require('../middleware/auth');
const myListController = require('../controllers/myListController');

// All routes require authentication
router.use(verifyFirebaseToken);
router.use(syncUserWithMongoDB);

// Get user's My List
router.get('/', myListController.getMyList);

// Add movie to My List
router.post('/', myListController.addToMyList);

// Check if movie is in My List
router.get('/check/:movieId', myListController.checkInMyList);

// Remove movie from My List
router.delete('/:movieId', myListController.removeFromMyList);

// Clear entire My List
router.delete('/', myListController.clearMyList);

module.exports = router;
