const Plan = require('../models/Plan');

// Get all active plans
const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ 'price.monthly': 1 });
    
    res.json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans'
    });
  }
};

// Get single plan by name
const getPlanByName = async (req, res) => {
  try {
    const { name } = req.params;
    const plan = await Plan.findOne({ name, isActive: true });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plan'
    });
  }
};

// Create new plan (admin only)
const createPlan = async (req, res) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    
    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create plan'
    });
  }
};

// Update plan (admin only)
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Plan updated successfully',
      data: plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update plan'
    });
  }
};

// Delete plan (admin only)
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndUpdate(id, { isActive: false }, { new: true });
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete plan'
    });
  }
};

module.exports = {
  getPlans,
  getPlanByName,
  createPlan,
  updatePlan,
  deletePlan
};
