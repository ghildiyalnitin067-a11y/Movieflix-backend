const express = require('express');
const router = express.Router();
const {
  getTestimonials,
  createTestimonial,
  getAllTestimonials,
  approveTestimonial,
  deleteTestimonial
} = require('../controllers/testimonialController');
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');

// Public routes
router.get('/', getTestimonials);

// Protected routes (require authentication)
router.post('/', verifyFirebaseToken, createTestimonial);

// Admin routes
router.get('/admin/all', verifyFirebaseToken, requireRole('admin'), getAllTestimonials);
router.put('/admin/approve/:id', verifyFirebaseToken, requireRole('admin'), approveTestimonial);
router.delete('/admin/:id', verifyFirebaseToken, requireRole('admin'), deleteTestimonial);

module.exports = router;
