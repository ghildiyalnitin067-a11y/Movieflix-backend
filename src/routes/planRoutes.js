const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, requireRole } = require('../middleware/auth');
const {
  getPlans,
  getPlanByName,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/planController');

// Public routes
router.get('/', getPlans);
router.get('/:name', getPlanByName);

// Admin only routes
router.post('/', verifyFirebaseToken, requireRole('admin'), createPlan);
router.put('/:id', verifyFirebaseToken, requireRole('admin'), updatePlan);
router.delete('/:id', verifyFirebaseToken, requireRole('admin'), deletePlan);


module.exports = router;
