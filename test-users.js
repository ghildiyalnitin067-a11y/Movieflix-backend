const User = require('./src/models/User');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://ghildiyalnitin2007:nitin2006@movieflix.ddljsh3.mongodb.net/movieflix?retryWrites=true&w=majority';

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log('✅ Connected to MongoDB');
    
    // Check if any users exist
    const count = await User.countDocuments();
    console.log('📊 Total users in database:', count);
    
    // List all users
    const users = await User.find({}, 'firebaseUid email displayName role');
    console.log('👥 Users:');
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.firebaseUid}) - Role: ${u.role}`);
    });
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
