const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length === 0) {
      // Option 1: Use service account credentials from environment variables
      if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('🔥 Firebase Admin SDK initialized with service account (env vars)');
      } 
      // Option 2: Use service account JSON file
      else {
        const serviceAccountPaths = [
          path.join(__dirname, 'firebase-service-account.json'),
          path.join(__dirname, 'movieflix-afeb8-firebase-adminsdk-fbsvc-e9f354d4a0.json'),
          process.env.GOOGLE_APPLICATION_CREDENTIALS
        ].filter(Boolean);

        let serviceAccount = null;
        for (const servicePath of serviceAccountPaths) {
          if (fs.existsSync(servicePath)) {
            try {
              serviceAccount = require(servicePath);
              console.log(`📄 Found service account file: ${servicePath}`);
              break;
            } catch (e) {
              console.log(`⚠️ Could not load service account from ${servicePath}`);
            }
          }
        }

        if (serviceAccount) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
          });
          console.log('🔥 Firebase Admin SDK initialized with service account file');
        } 
        // Option 3: Use application default credentials (last resort)
        else {
          const projectId = process.env.FIREBASE_PROJECT_ID || 'movieflix-afeb8';
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: projectId
          });
          console.log(`🔥 Firebase Admin SDK initialized with default credentials (project: ${projectId})`);
          console.log('⚠️ Warning: Using default credentials. Token verification may fail if projects don\'t match.');
        }
      }
    }

    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    // Fallback: Try to initialize with minimal config for development
    try {
      if (admin.apps.length === 0) {
        const projectId = process.env.FIREBASE_PROJECT_ID || 'movieflix-afeb8';
        admin.initializeApp({
          projectId: projectId
        });
        console.log(`🔥 Firebase Admin SDK initialized with minimal config (project: ${projectId})`);
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
