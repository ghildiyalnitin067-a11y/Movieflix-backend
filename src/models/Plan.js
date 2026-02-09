const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['basic', 'standard', 'premium']
  },
  displayName: {
    type: String,
    required: true
  },
  price: {
    monthly: { type: Number, required: true },
    yearly: { type: Number, required: true }
  },
  features: [{
    type: String
  }],
  quality: {
    type: String,
    required: true
  },
  resolution: {
    type: String,
    required: true
  },
  devices: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Static method to seed default plans
planSchema.statics.seedPlans = async function() {
  const count = await this.countDocuments();
  if (count === 0) {
    const plans = [
      {
        name: 'basic',
        displayName: 'Basic',
        price: { monthly: 199, yearly: 1999 },
        features: ['HD available', 'Watch on 1 device', 'Unlimited movies & TV shows'],
        quality: 'Good',
        resolution: '720p',
        devices: '1'
      },
      {
        name: 'standard',
        displayName: 'Standard',
        price: { monthly: 499, yearly: 4999 },
        features: ['Full HD available', 'Watch on 2 devices', 'Unlimited movies & TV shows', 'No ads'],
        quality: 'Better',
        resolution: '1080p',
        devices: '2'
      },
      {
        name: 'premium',
        displayName: 'Premium',
        price: { monthly: 649, yearly: 6499 },
        features: ['Ultra HD available', 'Watch on 4 devices', 'Unlimited movies & TV shows', 'No ads', 'Spatial audio'],
        quality: 'Best',
        resolution: '4K+HDR',
        devices: '4'
      }
    ];
    await this.insertMany(plans);
    console.log('✅ Default plans seeded');
  }
};

module.exports = mongoose.model('Plan', planSchema);
