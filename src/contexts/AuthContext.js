'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth, 
  googleProvider,
  appleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from '@/utils/firebase';
import { useRouter } from 'next/navigation';

// Create Auth Context
export const AuthContext = createContext({});

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// AuthProvider Component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Check if authentication is required (can be disabled via env var)
  const authRequired = process.env.NEXT_PUBLIC_AUTH_REQUIRED !== 'false';

  useEffect(() => {
    if (!auth) {
      console.error('Firebase not initialized - check NEXT_PUBLIC_FIREBASE_JSON');
      setLoading(false);
      if (authRequired) {
        setError('Authentication system not configured');
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('User authenticated:', firebaseUser.uid);
        
        try {
          // Get the ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Fetch user data from backend to check roles
          // Use Azure Functions if enabled, otherwise fallback to legacy Express
          const afEnabled = process.env.NEXT_PUBLIC_AF_ENABLED === 'true';
          const backendUrl = afEnabled
            ? (process.env.NEXT_PUBLIC_AF_URL || 'http://localhost:7071')
            : (process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010');
          const response = await fetch(
            `${backendUrl}/api/userlogins/firebase/${firebaseUser.uid}`,
            {
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const userData = await response.json();
          console.log('User data from backend:', userData);

          // Check if user has admin roles (RA, SA, or System Owner)
          const roles = userData.roleIds?.map(r => r.roleName || r.roleNameCode) || [];
          const hasAdminAccess = roles.some(role => 
            role === 'RegionalAdmin' || 
            role === 'RA' || 
            role === 'SystemAdmin' || 
            role === 'SA' ||
            role === 'SystemOwner' ||
            role === 'SO'
          );

          if (!hasAdminAccess && authRequired) {
            console.warn('User does not have admin access:', roles);
            await signOut(auth);
            setError('Access Denied: Admin privileges required. You have roles: ' + roles.join(', '));
            setUser(null);
            return;
          }

          // Determine default role (prefer RA)
          let defaultRole = 'RA'; // Default to Regional Admin
          if (roles.includes('SystemOwner') || roles.includes('SO')) {
            defaultRole = 'SystemOwner';
          } else if (roles.includes('SystemAdmin') || roles.includes('SA')) {
            defaultRole = 'SA';
          } else if (roles.includes('RegionalAdmin') || roles.includes('RA')) {
            defaultRole = 'RA';
          }

          // Set user with enhanced data
          setUser({
            ...firebaseUser,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || userData.displayName || firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            roles: roles,
            defaultRole: defaultRole,
            backendData: userData,
            token: idToken
          });
          
          setError(null);
        } catch (error) {
          console.error('Error fetching user data:', error);
          if (authRequired) {
            await signOut(auth);
            setError('Failed to validate user permissions');
            setUser(null);
          }
        }
      } else {
        console.log('No user authenticated');
        setUser(null);
      }
      
      setLoading(false);
    });

    // Token refresh interval
    let tokenRefreshInterval;
    if (auth.currentUser) {
      tokenRefreshInterval = setInterval(async () => {
        try {
          if (auth.currentUser) {
            const newToken = await auth.currentUser.getIdToken(true);
            setUser(prevUser => ({
              ...prevUser,
              token: newToken
            }));
            console.log('Auth token refreshed');
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
        }
      }, 30 * 60 * 1000); // 30 minutes
    }

    return () => {
      unsubscribe();
      if (tokenRefreshInterval) clearInterval(tokenRefreshInterval);
    };
  }, [authRequired, router]);

  // Login with Google
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!auth || !googleProvider) {
        throw new Error('Authentication not configured');
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google login successful:', result.user.email);
      // User state will be updated by onAuthStateChanged
      return result.user;
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Login with Apple
  const loginWithApple = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!auth || !appleProvider) {
        throw new Error('Authentication not configured');
      }
      
      const result = await signInWithPopup(auth, appleProvider);
      console.log('Apple login successful:', result.user.email);
      // User state will be updated by onAuthStateChanged
      return result.user;
    } catch (error) {
      console.error('Apple login error:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Login with Email/Password
  const loginWithEmail = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!auth) {
        throw new Error('Authentication not configured');
      }
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Email login successful:', result.user.email);
      // User state will be updated by onAuthStateChanged
      return result.user;
    } catch (error) {
      console.error('Email login error:', error);
      setError(error.message);
      setLoading(false);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    
    try {
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      setError(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get auth token for API calls
  const getAuthToken = async () => {
    if (!auth?.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    error,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    logout,
    getAuthToken,
    isAuthenticated: !!user,
    isAdmin: !!user, // If they're logged in, they're an admin
    authRequired
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}