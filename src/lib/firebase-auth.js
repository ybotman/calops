'use client';

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { useState, useEffect, createContext, useContext } from 'react';

// Initialize Firebase
const initFirebase = () => {
  try {
    const firebaseConfig = JSON.parse(
      atob(process.env.NEXT_PUBLIC_FIREBASE_JSON || '')
    );
    
    return initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

// Auth context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  // Temporarily bypass authentication by setting a mock user and no loading
  const [user, setUser] = useState({ uid: 'temp-user-id', email: 'admin@example.com' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Original authentication code is commented out
  /*
  useEffect(() => {
    const app = initFirebase();
    if (!app) {
      setError('Firebase initialization failed');
      setLoading(false);
      return;
    }

    const auth = getAuth(app);
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          // User is signed in
          setUser(firebaseUser);
        } else {
          // User is signed out
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  */

  // Mock login function - bypass authentication
  const login = async (email, password) => {
    // Just set mock user without actual authentication
    setUser({ uid: 'temp-user-id', email: email || 'admin@example.com' });
    return { uid: 'temp-user-id', email: email || 'admin@example.com' };
  };

  // Mock logout function - bypass authentication
  const logout = async () => {
    // We'll keep the mock user for now
    console.log('Logout requested but keeping mock user');
  };
  
  /* Original authentication code - will be restored later
  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const app = initFirebase();
      if (!app) throw new Error('Firebase not initialized');
      
      const auth = getAuth(app);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setLoading(false);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    
    try {
      const app = initFirebase();
      if (!app) throw new Error('Firebase not initialized');
      
      const auth = getAuth(app);
      await signOut(auth);
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };
  */

  // Auth context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}