'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DatabaseContext = createContext();

const DB_ENVIRONMENT_KEY = 'database-environment';

export function DatabaseProvider({ children }) {
  // Initialize from localStorage or default to TEST
  const [environment, setEnvironment] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DB_ENVIRONMENT_KEY);
      return stored && ['test', 'prod'].includes(stored) ? stored : 'test';
    }
    return 'test';
  });
  
  const [isLoading, setIsLoading] = useState(false);

  // Persist environment changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DB_ENVIRONMENT_KEY, environment);
    }
  }, [environment]);

  const switchEnvironment = useCallback((newEnvironment) => {
    if (!['test', 'prod'].includes(newEnvironment)) {
      throw new Error('Environment must be either "test" or "prod"');
    }
    
    if (newEnvironment !== environment) {
      setIsLoading(true);
      setEnvironment(newEnvironment);
      
      // Add a small delay to show loading state, then refresh
      setTimeout(() => {
        setIsLoading(false);
        // Force a page refresh to reload all data with new environment
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 500);
    }
  }, [environment]);

  return (
    <DatabaseContext.Provider value={{ 
      environment, 
      switchEnvironment,
      isTest: environment === 'test',
      isProd: environment === 'prod',
      isLoading
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
}