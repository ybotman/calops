'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/lib/AppContext';

/**
 * Custom hook for fetching and managing Firebase users
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID (default: from AppContext)
 * @param {number} [options.maxResults] - Maximum users to fetch (default: 1000)
 * @param {boolean} [options.autoFetch] - Auto-fetch on mount (default: true)
 * @returns {Object} Firebase users data and operations
 */
const useFirebaseUsers = (options = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const appId = options.appId || currentApp?.id || '1';
  const maxResults = options.maxResults || 1000;
  const autoFetch = options.autoFetch !== false; // Default true
  
  // State for Firebase users data
  const [firebaseUsers, setFirebaseUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch Firebase users from the API
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @returns {Promise<Object>} Fetched Firebase users data
   */
  const fetchFirebaseUsers = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching Firebase users: appId=${appId}, maxResults=${maxResults}`);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        appId,
        maxResults: maxResults.toString(),
        ...(forceRefresh && { forceRefresh: 'true' })
      });
      
      // Fetch from API
      const response = await fetch(`/api/firebase-users?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!data.firebaseUsers || !Array.isArray(data.firebaseUsers)) {
        throw new Error('Invalid response format: firebaseUsers array not found');
      }
      
      // Update state
      setFirebaseUsers(data.firebaseUsers);
      setStats(data.stats || { total: 0, matched: 0, unmatched: 0 });
      setLastUpdated(Date.now());
      
      console.log(`Successfully fetched ${data.firebaseUsers.length} Firebase users`);
      console.log(`Stats: ${data.stats?.total || 0} total, ${data.stats?.matched || 0} matched, ${data.stats?.unmatched || 0} unmatched`);
      
      return data;
      
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch Firebase users';
      console.error('Error fetching Firebase users:', errorMessage, err);
      setError(err);
      
      // Don't clear existing data on error unless it's the first fetch
      if (firebaseUsers.length === 0) {
        setFirebaseUsers([]);
        setStats({ total: 0, matched: 0, unmatched: 0 });
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, maxResults, firebaseUsers.length]);

  /**
   * Get a Firebase user by UID
   * @param {string} uid - Firebase user UID
   * @returns {Object|undefined} Firebase user object or undefined if not found
   */
  const getFirebaseUserByUid = useCallback((uid) => {
    if (!uid) return undefined;
    return firebaseUsers.find(user => user.uid === uid);
  }, [firebaseUsers]);

  /**
   * Filter Firebase users by match status
   * @param {string} status - 'matched', 'unmatched', or 'all'
   * @returns {Array} Filtered Firebase users
   */
  const getFilteredUsers = useCallback((status = 'all') => {
    if (status === 'all') return firebaseUsers;
    return firebaseUsers.filter(user => user.matchStatus === status);
  }, [firebaseUsers]);

  /**
   * Get users by authentication provider
   * @param {string} provider - Provider ID (e.g., 'google.com', 'password')
   * @returns {Array} Firebase users using the specified provider
   */
  const getUsersByProvider = useCallback((provider) => {
    return firebaseUsers.filter(user => user.primaryProvider === provider);
  }, [firebaseUsers]);

  /**
   * Get provider statistics
   * @returns {Object} Provider usage statistics
   */
  const getProviderStats = useCallback(() => {
    const providerCounts = {};
    firebaseUsers.forEach(user => {
      const provider = user.primaryProvider || 'unknown';
      providerCounts[provider] = (providerCounts[provider] || 0) + 1;
    });
    return providerCounts;
  }, [firebaseUsers]);

  /**
   * Refresh Firebase users data
   * @returns {Promise<Object>} Refreshed data
   */
  const refresh = useCallback(() => {
    return fetchFirebaseUsers(true);
  }, [fetchFirebaseUsers]);

  // Auto-fetch on mount and when appId changes
  useEffect(() => {
    if (autoFetch) {
      fetchFirebaseUsers();
    }
  }, [fetchFirebaseUsers, autoFetch]);

  // Return hook API
  return {
    // Data
    firebaseUsers,
    stats,
    loading,
    error,
    lastUpdated,
    
    // Operations
    fetchFirebaseUsers,
    refresh,
    getFirebaseUserByUid,
    getFilteredUsers,
    getUsersByProvider,
    getProviderStats,
    
    // Metadata
    appId,
    maxResults
  };
};

export default useFirebaseUsers;