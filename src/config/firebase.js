const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (admin.apps.length > 0) {
      console.log('🔥 Firebase Admin SDK already initialized');
      return admin;
    }

    console.log('🔧 Initializing Firebase Admin SDK...');
    
    // Log environment variables status (without exposing sensitive values)
    const hasPrivateKey = !!process.env.FIREBASE_PRIVATE_KEY;
    const hasClientEmail = !!process.env.FIREBASE_CLIENT_EMAIL;
    const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
    const hasServiceAccountPath = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    console.log(`📋 Firebase Config Status:
      - FIREBASE_PRIVATE_KEY: ${hasPrivateKey ? '✅ Set' : '❌ Not Set'}
      - FIREBASE_CLIENT_EMAIL: ${hasClientEmail ? '✅ Set' : '❌ Not Set'}
      - FIREBASE_PROJECT_ID: ${hasProjectId ? '✅ Set' : '❌ Not Set'}
      - GOOGLE_APPLICATION_CREDENTIALS: ${hasServiceAccountPath ? '✅ Set' : '❌ Not Set'}
    `);

    // Option 1: Use service account credentials from environment variables
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
        
        // Validate private key format
        if (!privateKey.includes('BEGIN PRIVATE KEY') && !privateKey.includes('BEGIN RSA PRIVATE KEY')) {
          console.error('❌ Invalid FIREBASE_PRIVATE_KEY format. Key should include header/footer.');
          throw new Error('Invalid private key format');
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: privateKey,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        console.log('🔥 Firebase Admin SDK initialized with service account (env vars)');
        console.log(`📁 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
      } catch (envInitError) {
        console.error('❌ Failed to initialize with env vars:', envInitError.message);
        throw envInitError;
      }
    } 

    // Option 2: Use service account JSON file
    else {
      const serviceAccountPaths = [
        path.join(__dirname, 'firebase-service-account.json'),
        path.join(__dirname, 'movieflix-afeb8-firebase-adminsdk-fbsvc-e9f354d4a0.json'),
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      ].filter(Boolean);

      let serviceAccount = null;
      let loadedPath = null;
      
      for (const servicePath of serviceAccountPaths) {
        if (fs.existsSync(servicePath)) {
          try {
            serviceAccount = require(servicePath);
            loadedPath = servicePath;
            console.log(`📄 Found service account file: ${servicePath}`);
            break;
          } catch (e) {
            console.log(`⚠️ Could not load service account from ${servicePath}: ${e.message}`);
          }
        } else {
          console.log(`🔍 Service account file not found: ${servicePath}`);
        }
      }

      if (serviceAccount) {
        try {
          const projectId = serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID;
          if (!projectId) {
            throw new Error('No project ID found in service account or environment variables');
          }
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId
          });
          console.log('🔥 Firebase Admin SDK initialized with service account file');
          console.log(`📁 Project ID: ${projectId}`);
          console.log(`📄 Loaded from: ${loadedPath}`);
        } catch (fileInitError) {
          console.error('❌ Failed to initialize with service account file:', fileInitError.message);
          throw fileInitError;
        }
      } 
      // Option 3: Use application default credentials (last resort)
      else {
        const projectId = process.env.FIREBASE_PROJECT_ID || 'movieflix-afeb8';
        console.log(`⚠️ No service account found. Trying application default credentials...`);
        console.log(`📁 Using project ID: ${projectId}`);
        
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: projectId
          });
          console.log(`🔥 Firebase Admin SDK initialized with default credentials (project: ${projectId})`);
          console.log('⚠️ Warning: Using default credentials. Token verification may fail if projects don\'t match.');
        } catch (defaultError) {
          console.error('❌ Failed to initialize with default credentials:', defaultError.message);
          throw defaultError;
        }
      }
    }

    return admin;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Don't try fallback - let the error propagate so the server doesn't start with broken auth
    throw error;
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
