const mongoose = require('mongoose');
const Plan = require('./src/models/Plan');
require('dotenv').config();

const seedPlans = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movieflix');
    console.log('✅ Connected to MongoDB');

    // Seed plans
    await Plan.seedPlans();

    // Verify plans were created
    const plans = await Plan.find();
    console.log(`📋 ${plans.length} plans in database:`);
    plans.forEach(plan => {
      console.log(`  - ${plan.displayName}: ₹${plan.price.monthly}/month`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();
