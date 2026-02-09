/**
 * MongoDB Connection Test Script
 * Tests connection to your MongoDB Atlas cluster
 */

const mongoose = require('mongoose');

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://ghildiyalnitin2007:nitin2006@movieflix.ddljsh3.mongodb.net/movieflix?retryWrites=true&w=majority&appName=movieflix';

console.log('🔍 Testing MongoDB Connection...\n');

async function testConnection() {
  try {
    // Connection options (removed deprecated options for Mongoose 6+)
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s
    };

    console.log('⏳ Connecting to MongoDB Atlas...');
    console.log(`📍 URI: ${MONGODB_URI.replace(/:([^@]+)@/, ':****@')}\n`);

    // Attempt connection
    const conn = await mongoose.connect(MONGODB_URI, options);


    console.log('✅ MongoDB Connected Successfully!\n');
    console.log('📊 Connection Details:');
    console.log(`   • Host: ${conn.connection.host}`);
    console.log(`   • Database: ${conn.connection.name}`);
    console.log(`   • Port: ${conn.connection.port}`);
    console.log(`   • Ready State: ${conn.connection.readyState} (1 = connected)`);
    console.log(`   • Connection ID: ${conn.connection.id}\n`);

    // Test database operations
    console.log('🧪 Testing Database Operations...');
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   • Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`     - ${col.name}`);
    });

    // Test write operation
    const testCollection = mongoose.connection.db.collection('connection_test');
    await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test successful'
    });
    console.log('   • Write test: ✅ PASSED');

    // Test read operation
    const readResult = await testCollection.findOne({ test: true });
    if (readResult) {
      console.log('   • Read test: ✅ PASSED');
    }

    // Clean up test data
    await testCollection.deleteMany({ test: true });
    console.log('   • Cleanup: ✅ COMPLETED\n');

    console.log('🎉 All tests passed! MongoDB is fully operational.\n');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed gracefully.');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!\n');
    console.error('Error Details:');
    console.error(`   • Name: ${error.name}`);
    console.error(`   • Message: ${error.message}`);
    
    if (error.code) {
      console.error(`   • Code: ${error.code}`);
    }
    
    if (error.reason) {
      console.error(`   • Reason: ${error.reason}`);
    }

    console.error('\n🔧 Troubleshooting Tips:');
    console.error('   1. Check your internet connection');
    console.error('   2. Verify MongoDB Atlas cluster is running');
    console.error('   3. Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for all IPs)');
    console.error('   4. Verify username and password are correct');
    console.error('   5. Ensure database user has proper permissions');

    process.exit(1);
  }
}

// Run test
testConnection();
