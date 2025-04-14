import admin from 'firebase-admin';

// Initialize admin if needed and possible
let isInitialized = false;

try {
  // Only initialize once
  if (!admin.apps.length) {
    try {
      // Parse the base64-encoded Firebase service account credentials
      // If FIREBASE_JSON is not defined, use an empty object to allow local development
      let serviceAccount;
      if (process.env.FIREBASE_JSON) {
        serviceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_JSON, 'base64').toString('utf-8')
        );
        
        // Initialize Firebase Admin SDK
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        
        isInitialized = true;
        console.log('Firebase Admin SDK initialized successfully!');
      } else {
        console.warn('FIREBASE_JSON not found, Firebase Admin SDK not initialized');
      }
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  } else {
    isInitialized = true;
  }
} catch (err) {
  console.error('Error setting up Firebase Admin:', err);
}

// Export an object with the admin instance and initialization status
export default {
  admin,
  isInitialized,
  
  // Helper function to check if Firebase is available
  isAvailable: () => isInitialized && admin.apps.length > 0,
  
  // Get auth if available
  getAuth: () => {
    if (!isInitialized) {
      console.warn('Firebase Admin SDK not initialized, auth not available');
      return null;
    }
    return admin.auth();
  }
};