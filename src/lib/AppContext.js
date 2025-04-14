'use client';

import { createContext, useState, useContext, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [currentApp, setCurrentApp] = useState({ id: '1', name: 'TangoTiempo' });
  
  // Function to update the current app
  const updateCurrentApp = (app) => {
    setCurrentApp(app);
    
    // Store selection in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentApp', JSON.stringify(app));
    }
    
    // Optionally dispatch a custom event to notify components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appChanged', { detail: app }));
    }
  };
  
  // Initialize from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedApp = localStorage.getItem('currentApp');
      if (storedApp) {
        try {
          setCurrentApp(JSON.parse(storedApp));
        } catch (error) {
          console.error('Error parsing stored app:', error);
        }
      }
    }
  }, []);
  
  const contextValue = {
    currentApp,
    updateCurrentApp,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}