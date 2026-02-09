const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB Atlas connection string
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://ghildiyalnitin2007:nitin2006@movieflix.ddljsh3.mongodb.net/movieflix?retryWrites=true&w=majority&appName=movieflix';

    const conn = await mongoose.connect(MONGODB_URI);


    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);


    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
