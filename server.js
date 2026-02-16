const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import database and Firebase configurations
const connectDB = require('./src/config/db');
const { initializeFirebase } = require('./src/config/firebase');

const app = express();
const PORT = process.env.PORT || 5001;


// Initialize connections
let dbConnected = false;
let firebaseInitialized = false;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:5174',  // Vite dev server (alternative port)
  'http://localhost:3000',  // Alternative dev port
  'http://localhost:5000',  // Backend port (legacy)
  'http://localhost:5001',  // Backend port (current)
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5001',
  'https://movieflix-a11111-ui.vercel.app/', // Vercel production frontend
  process.env.FRONTEND_URL, // Production frontend URL from env
].filter(Boolean); // Remove undefined values



// In development, allow all origins. In production, use whitelist
const isDevelopment = process.env.NODE_ENV !== 'production';


app.get("/api", (req, res) => {
  res.json({ message: "MovieFlix API is running 🚀" });
});

app.use(cors({
  origin: isDevelopment ? true : function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));


app.use(express.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        error: 'Invalid JSON',
        message: 'Request body contains malformed JSON'
      });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// Routes
const mainRoutes = require('./src/routes/index');
app.use('/api', mainRoutes);


// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Node.js Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    connections: {
      database: dbConnected,
      firebase: firebaseInitialized
    }
  });
});

// Connection status endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Node.js Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    connections: {
      database: dbConnected,
      firebase: firebaseInitialized,
      mongodb: dbConnected ? 'connected' : 'disconnected',
      firebase: firebaseInitialized ? 'initialized' : 'not initialized'
    }
  });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Initialize connections and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await connectDB();
    dbConnected = true;
    console.log('✅ MongoDB connected successfully');
    
    // Initialize Firebase
    console.log('🔥 Initializing Firebase...');
    initializeFirebase();
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`📊 Database: MongoDB Atlas`);
      console.log(`🔐 Auth: Firebase Admin SDK`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
