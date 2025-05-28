'use client';

import { useEffect } from 'react';
import { useDatabaseContext } from '@/lib/DatabaseContext';
import { setGlobalDatabaseEnvironment } from '@/lib/api-client';

/**
 * Component to sync database environment from context to global API client state
 * This ensures all API calls include the correct database environment header
 */
export default function DatabaseEnvironmentSync() {
  const { environment } = useDatabaseContext();

  useEffect(() => {
    // Update the global database environment in the API client
    setGlobalDatabaseEnvironment(environment);
    console.log(`🔧 Database environment updated to: ${environment.toUpperCase()}`);
    
    // Force update of any cached data or connections
    if (typeof window !== 'undefined') {
      // Clear any cached API data that might be environment-specific
      window.dispatchEvent(new CustomEvent('database-environment-changed', { 
        detail: { environment } 
      }));
    }
  }, [environment]);

  // This component doesn't render anything
  return null;
}