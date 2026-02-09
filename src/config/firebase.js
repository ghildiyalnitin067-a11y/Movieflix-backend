const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      // For development/testing: Use Firebase config from frontend
      // This is a simplified setup - in production, use proper service account
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: "movieflix-afeb8"
      });

      console.log('🔥 Firebase Admin SDK initialized successfully');
    }

    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    // Fallback: Try to initialize with minimal config for development
    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          projectId: "movieflix-afeb8"
        });
        console.log('🔥 Firebase Admin SDK initialized with minimal config');
      }
      return admin;
    } catch (fallbackError) {
      console.error('❌ Fallback Firebase initialization also failed:', fallbackError.message);
      throw error;
    }
  }
};

// Get Firebase services
const getAuth = () => admin.auth();
const getFirestore = () => admin.firestore();
const getStorage = () => admin.storage();

module.exports = {
  initializeFirebase,
  getAuth,
  getFirestore,
  getStorage,
  admin
};
