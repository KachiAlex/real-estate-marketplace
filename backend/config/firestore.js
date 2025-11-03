const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let initialized = false;

const initializeFirestore = () => {
  if (initialized) {
    return admin.firestore();
  }

  try {
    // Check if Firebase Admin is already initialized
    if (admin.apps.length === 0) {
      // Initialize with service account or environment variables
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Parse service account key from environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
        });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use service account file path
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
      } else {
        // Initialize with project ID (for Firebase emulator or default credentials)
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'real-estate-marketplace-37544'
        });
      }
    }
    
    initialized = true;
    console.log('✅ Firestore initialized');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error.message);
    throw error;
  }
};

// Get Firestore instance
const getFirestore = () => {
  if (!initialized) {
    return initializeFirestore();
  }
  return admin.firestore();
};

module.exports = {
  initializeFirestore,
  getFirestore,
  admin
};

