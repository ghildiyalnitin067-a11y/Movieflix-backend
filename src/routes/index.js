const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const userRoutes = require('./userRoutes');
const myListRoutes = require('./myListRoutes');
const planRoutes = require('./planRoutes');
const profileRoutes = require('./profileRoutes');
const testimonialRoutes = require('./testimonialRoutes');
const watchHistoryRoutes = require('./watchHistoryRoutes');


// Main routes

router.get('/status', mainController.getStatus);
router.get('/health', mainController.getHealth);
router.post('/data', mainController.postData);

// User routes (requires authentication)
router.use('/users', userRoutes);

// My List routes (requires authentication)
router.use('/mylist', myListRoutes);

// Plan routes (public read, admin write)
router.use('/plans', planRoutes);

// Profile routes (requires authentication)
router.use('/profiles', profileRoutes);

// Testimonial routes (public read)
router.use('/testimonials', testimonialRoutes);

// Watch History routes (requires authentication)
router.use('/watch-history', watchHistoryRoutes);

module.exports = router;
