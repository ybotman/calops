import admin from 'firebase-admin';

// Check if Firebase Admin SDK is already initialized
if (!admin.apps.length) {
  try {
    // Parse the base64-encoded Firebase service account credentials
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_JSON, 'base64').toString('utf-8')
    );

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('Firebase Admin SDK initialized successfully!');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export default admin;