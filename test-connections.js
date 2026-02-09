/**
 * Connection Test Script
 * Tests MongoDB and Firebase connections
 */

const mongoose = require('mongoose');
const { initializeFirebase, getAuth } = require('./src/config/firebase');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://ghildiyalnitin2007:nitin2006@movieflix.ddljsh3.mongodb.net/movieflix?retryWrites=true&w=majority&appName=movieflix';

console.log('🔍 Testing Connections...\n');

// Test MongoDB Connection
const testMongoDB = async () => {
  console.log('📡 Testing MongoDB Connection...');
  try {
    await mongoose.connect(MONGODB_URI);

    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   Collections: ${collections.length} found`);
    collections.forEach(col => console.log(`     - ${col.name}`));
    
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed\n');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    return false;
  }
};

// Test Firebase Initialization
const testFirebase = async () => {
  console.log('🔥 Testing Firebase Initialization...');
  try {
    initializeFirebase();
    
    const auth = getAuth();
    console.log('✅ Firebase Admin SDK Initialized Successfully!');
    console.log(`   Auth Service: ${auth ? 'Available' : 'Not Available'}`);
    
    // Try to list users (will fail without proper credentials but confirms initialization)
    try {
      const listUsersResult = await auth.listUsers(1);
      console.log(`   Users in database: ${listUsersResult.users.length}`);
    } catch (authError) {
      console.log(`   Auth Status: Initialized (user listing requires service account)`);
    }
    
    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Firebase Initialization Failed:', error.message);
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('═══════════════════════════════════════');
  console.log('   CONNECTION TEST STARTED');
  console.log('═══════════════════════════════════════\n');
  
  const mongoResult = await testMongoDB();
  const firebaseResult = await testFirebase();
  
  console.log('═══════════════════════════════════════');
  console.log('   TEST RESULTS');
  console.log('═══════════════════════════════════════');
  console.log(`MongoDB:    ${mongoResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Firebase:   ${firebaseResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════');
  
  if (mongoResult && firebaseResult) {
    console.log('\n🎉 All connections working! Your backend is ready.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some connections failed. Check the errors above.');
    process.exit(1);
  }
};

runTests();
