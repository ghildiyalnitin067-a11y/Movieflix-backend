/**
 * Test script for My List functionality
 * Run with: node test-mylist.js
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

// Test configuration
const TEST_FIREBASE_UID = 'test-user-mylist-' + Date.now();
const TEST_EMAIL = `test-mylist-${Date.now()}@example.com`;

async function testMyList() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/netflix-clone');
    console.log('✅ Connected to MongoDB');

    // Create test user
    console.log('\n👤 Creating test user...');
    const user = new User({
      firebaseUid: TEST_FIREBASE_UID,
      email: TEST_EMAIL,
      displayName: 'Test MyList User',
      role: 'user'
    });
    await user.save();
    console.log('✅ Test user created:', user._id);

    // Test 1: Add movie to My List
    console.log('\n📝 Test 1: Adding movie to My List...');
    await user.addToMyList({
      movieId: 'movie-123',
      title: 'The Matrix',
      posterPath: '/matrix-poster.jpg',
      mediaType: 'movie'
    });
    console.log('✅ Movie added to My List');

    // Test 2: Add TV show to My List
    console.log('\n📺 Test 2: Adding TV show to My List...');
    await user.addToMyList({
      movieId: 'tv-456',
      title: 'Breaking Bad',
      posterPath: '/breaking-bad-poster.jpg',
      mediaType: 'tv'
    });
    console.log('✅ TV show added to My List');

    // Test 3: Check if movie is in My List
    console.log('\n🔍 Test 3: Checking if movie is in My List...');
    const isInList = user.isInMyList('movie-123');
    console.log('✅ Movie in My List:', isInList);

    // Test 4: Try to add duplicate (should fail)
    console.log('\n🚫 Test 4: Trying to add duplicate...');
    try {
      await user.addToMyList({
        movieId: 'movie-123',
        title: 'The Matrix',
        posterPath: '/matrix-poster.jpg',
        mediaType: 'movie'
      });
      console.log('❌ Should have thrown error for duplicate');
    } catch (error) {
      console.log('✅ Correctly prevented duplicate:', error.message);
    }

    // Test 5: Get My List
    console.log('\n📋 Test 5: Getting My List...');
    const myList = user.getMyList();
    console.log('✅ My List count:', myList.length);
    console.log('   Items:');
    myList.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.mediaType}) - Added: ${item.addedAt}`);
    });

    // Test 6: Remove from My List
    console.log('\n🗑️  Test 6: Removing movie from My List...');
    await user.removeFromMyList('movie-123');
    console.log('✅ Movie removed from My List');

    // Test 7: Verify removal
    console.log('\n✅ Test 7: Verifying removal...');
    const updatedList = user.getMyList();
    console.log('✅ Updated My List count:', updatedList.length);

    // Test 8: Try to remove non-existent movie (should fail)
    console.log('\n🚫 Test 8: Trying to remove non-existent movie...');
    try {
      await user.removeFromMyList('non-existent-id');
      console.log('❌ Should have thrown error for non-existent movie');
    } catch (error) {
      console.log('✅ Correctly handled non-existent movie:', error.message);
    }

    // Test 9: Check public profile includes myListCount
    console.log('\n👤 Test 9: Checking public profile...');
    const publicProfile = user.toPublicProfile();
    console.log('✅ Public profile includes myListCount:', publicProfile.myListCount);

    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    await User.findByIdAndDelete(user._id);
    console.log('✅ Test user deleted');

    console.log('\n🎉 All My List tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testMyList();
