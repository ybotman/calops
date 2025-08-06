// utils/firebase.js

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  EmailAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

// Decode the Base64 encoded JSON string from the environment variable
const getFirebaseConfig = () => {
  try {
    if (!process.env.NEXT_PUBLIC_FIREBASE_JSON) {
      console.error('NEXT_PUBLIC_FIREBASE_JSON environment variable not set');
      return null;
    }
    
    const decodedFirebaseConfig = JSON.parse(
      Buffer.from(process.env.NEXT_PUBLIC_FIREBASE_JSON, 'base64').toString('utf-8')
    );
    
    console.log('Firebase Configuration loaded for project:', decodedFirebaseConfig.projectId);
    return decodedFirebaseConfig;
  } catch (error) {
    console.error('Error decoding Firebase configuration:', error);
    return null;
  }
};

// Initialize Firebase app
let app = null;
let auth = null;
let googleProvider = null;
let emailProvider = null;
let appleProvider = null;

const firebaseConfig = getFirebaseConfig();
if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Initialize Auth Providers
  googleProvider = new GoogleAuthProvider();
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
  
  emailProvider = new EmailAuthProvider();
  
  // Apple provider
  appleProvider = new OAuthProvider('apple.com');
  appleProvider.addScope('email');
  appleProvider.addScope('name');
}

export { 
  auth, 
  googleProvider, 
  emailProvider,
  appleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};