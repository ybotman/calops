'use client';

import { createContext, useContext, useState } from 'react';

const DatabaseContext = createContext();

export function DatabaseProvider({ children }) {
  const [environment, setEnvironment] = useState('test'); // Default to TEST

  const switchEnvironment = (newEnvironment) => {
    if (!['test', 'prod'].includes(newEnvironment)) {
      throw new Error('Environment must be either "test" or "prod"');
    }
    setEnvironment(newEnvironment);
  };

  return (
    <DatabaseContext.Provider value={{ 
      environment, 
      switchEnvironment,
      isTest: environment === 'test',
      isProd: environment === 'prod'
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