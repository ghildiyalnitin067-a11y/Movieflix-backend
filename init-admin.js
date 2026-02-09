/**
 * Initialize Permanent Admin
 * This script ensures ghildiyalnitin2007@gmail.com is set as admin in MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const { ADMIN_EMAILS } = require('./src/config/admin');

async function initAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const email of ADMIN_EMAILS) {
      // Find or create admin user
      let user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        console.log(`\n👤 Creating admin user: ${email}`);
        user = new User({
          firebaseUid: `admin-${Date.now()}`, // Temporary UID, will be updated when they log in
          email: email.toLowerCase(),
          displayName: 'Admin',
          role: 'admin',
          isActive: true,
          isEmailVerified: true,
          lastLoginAt: new Date()
        });
        await user.save();
        console.log(`✅ Admin user created: ${email}`);
      } else {
        console.log(`\n👤 Found existing user: ${email}`);
        
        // Ensure role is admin
        if (user.role !== 'admin') {
          user.role = 'admin';
          await user.save();
          console.log(`✅ Updated role to admin: ${email}`);
        } else {
          console.log(`✅ Already has admin role: ${email}`);
        }
      }

      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
    }

    console.log('\n🎉 Admin initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    process.exit(1);
  }
}

initAdmin();
