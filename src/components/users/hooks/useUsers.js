'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usersApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';
import useRoles from './useRoles';

/**
 * Enhanced custom hook for fetching and managing users
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID (default: from AppContext)
 * @param {Object} [options.initialFilters] - Initial filter settings
 * @param {string} [options.initialFilters.searchTerm] - Initial search term
 * @param {number} [options.initialFilters.tabValue] - Initial tab value
 * @param {Object} [options.cacheOptions] - Cache configuration
 * @param {number} [options.cacheOptions.maxAge] - Maximum cache age in ms (default: 2 minutes)
 * @returns {Object} Users data and operations
 */
const useUsers = (options = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const appId = options.appId || currentApp?.id || '1';
  
  // Cache configuration with defaults
  const cacheOptions = {
    maxAge: 2 * 60 * 1000, // 2 minutes in milliseconds
    ...(options.cacheOptions || {})
  };
  
  // Get roles data
  const { roles, processRoleIds, loading: rolesLoading } = useRoles({ appId });
  
  // State for users data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState(options.initialFilters?.searchTerm || '');
  const [tabValue, setTabValue] = useState(options.initialFilters?.tabValue || 0);
  
  // State for pagination
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    totalCount: 0
  });

  /**
   * Process user data from API to add computed fields
   * @param {Array} usersData - Raw users data from API
   * @returns {Array} Processed users with computed fields
   */
  const processUsers = useCallback((usersData) => {
    if (!Array.isArray(usersData)) return [];
    
    return usersData.map(user => {
      // Process role names for display
      const roleNamesStr = processRoleIds(user.roleIds);
      
      // Construct display name with priority: localUserInfo names, then firebaseUserInfo.displayName, then fallback
      const localName = `${user.localUserInfo?.firstName || ''} ${user.localUserInfo?.lastName || ''}`.trim();
      const firebaseDisplayName = user.firebaseUserInfo?.displayName || '';
      const displayName = localName || firebaseDisplayName || 'Unnamed User';
      
      // Get email with proper fallback
      const email = user.firebaseUserInfo?.email || 'No email';

      return {
        ...user,
        id: user._id, // For DataGrid key
        displayName,
        email,
        roleNames: roleNamesStr || '',
        isApproved: user.localUserInfo?.isApproved ? 'Yes' : 'No',
        isEnabled: user.localUserInfo?.isEnabled ? 'Yes' : 'No',
        isOrganizer: user.regionalOrganizerInfo?.organizerId ? 'Yes' : 'No',
        hasOrganizerId: !!user.regionalOrganizerInfo?.organizerId,
        localUserInfo: user.localUserInfo || {},
        regionalOrganizerInfo: user.regionalOrganizerInfo || {},
        regionalAdminInfo: user.regionalAdminInfo || {},
      };
    });
  }, [processRoleIds]);

  /**
   * Fetch users from the API with improved error handling and retries
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @param {number} [retryCount=0] - Current retry attempt count
   * @returns {Promise<Array>} Fetched and processed users
   */
  const fetchUsers = useCallback(async (forceRefresh = false, retryCount = 0) => {
    // Skip fetch if we have users and aren't forcing a refresh
    if (users.length > 0 && !forceRefresh && lastUpdated) {
      // Only use cached data if it's less than the configured cache age
      const cacheAge = Date.now() - lastUpdated;
      if (cacheAge < cacheOptions.maxAge) {
        console.log(`Using cached users data (age: ${Math.round(cacheAge/1000)}s)`);
        return users;
      }
    }

    try {
      // Don't set loading state immediately if we have cached data
      // This prevents UI flicker when refreshing in the background
      if (users.length === 0 || forceRefresh) {
        setLoading(true);
      }
      setError(null);
      
      // Add timestamp to force fresh data
      const timestamp = Date.now();
      
      // Always ensure appId is a string
      let normalizedAppId = appId;
      if (typeof normalizedAppId === 'object' && normalizedAppId !== null) {
        console.warn('Object passed as appId in fetchUsers, normalizing', normalizedAppId);
        normalizedAppId = normalizedAppId.id || '1';
      }
      
      // Fetch users from API with optimized options
      let usersData;
      try {
        // Use the improved API client
        usersData = await usersApi.getUsers({ 
          appId: normalizedAppId,
          timestamp,
          // Generate a unique request ID to help with deduplication
          requestId: `users-fetch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        });
      } catch (fetchError) {
        // Enhanced retry logic for transient network issues
        if (retryCount < 2) { // Allow up to 2 retries (3 attempts total)
          console.warn(`Error fetching users, retrying (attempt ${retryCount + 1}/3)...`, fetchError);
          
          // Exponential backoff with jitter to prevent thundering herd
          const baseDelay = 1000 * Math.pow(2, retryCount);
          const jitter = Math.random() * 500; // Add up to 500ms of random jitter
          const delay = baseDelay + jitter;
          
          console.log(`Retrying after ${Math.round(delay)}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchUsers(forceRefresh, retryCount + 1);
        }
        throw fetchError; // Re-throw if we've exhausted retries
      }
      
      // Process users data
      const processedUsers = processUsers(usersData);
      
      // Update state, but only if we got valid data
      if (Array.isArray(processedUsers) && processedUsers.length > 0) {
        setUsers(processedUsers);
        setLastUpdated(Date.now());
        
        // Update pagination total count
        setPagination(prev => ({
          ...prev,
          totalCount: processedUsers.length
        }));
        
        console.log(`Successfully fetched and processed ${processedUsers.length} users`);
      } else if (usersData.length === 0) {
        // If we got an empty array but it's valid, update the state
        setUsers([]);
        setLastUpdated(Date.now());
        setPagination(prev => ({
          ...prev,
          totalCount: 0
        }));
        console.log('Received 0 users from API (valid empty result)');
      } else {
        console.warn('Invalid users data received:', usersData);
        // If we have existing users data, don't overwrite it with bad data
        if (users.length === 0) {
          setUsers([]);
          setPagination(prev => ({
            ...prev,
            totalCount: 0
          }));
        }
      }
      
      return processedUsers;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error(`Error fetching users: ${errorMessage}`, err);
      setError(err);
      
      // Don't return empty array if we have existing data
      return users.length > 0 ? users : [];
    } finally {
      setLoading(false);
    }
  }, [appId, users, lastUpdated, processUsers, cacheOptions.maxAge]);

  // Stable debounced fetch function to prevent useEffect loops
  const debouncedFetch = useCallback(async (forceRefresh = false) => {
    // Simple debounce - just call fetchUsers directly since we have caching
    return await fetchUsers(forceRefresh);
  }, [fetchUsers]);
  
  // Fetch users when the hook is first mounted and when appId changes
  useEffect(() => {
    // Only fetch if roles are loaded (or loading failed) AND roles array has data
    // This prevents the race condition where processRoleIds runs with empty roles array
    if (!rolesLoading && roles.length > 0) {
      // Check if the data in the cache is fresh enough
      const cacheAge = lastUpdated ? Date.now() - lastUpdated : Infinity;
      
      // Only fetch if cache is stale OR we have no data
      // Remove users.length dependency to prevent infinite loops
      if (cacheAge > cacheOptions.maxAge || !lastUpdated) {
        debouncedFetch();
      }
    }
  }, [debouncedFetch, appId, rolesLoading, roles.length, lastUpdated, cacheOptions.maxAge]);

  /**
   * Filter users based on search term and current tab with improved error handling
   * @param {string} [term] - Search term to filter by (defaults to current searchTerm)
   * @param {number} [tab] - Tab value to filter by (defaults to current tabValue)
   */
  const filterUsers = useCallback((term = searchTerm, tab = tabValue) => {
    try {
      let filtered = users;
      
      // Apply tab filtering
      if (tab === 1) { // Organizers
        filtered = filtered.filter(user => user.regionalOrganizerInfo?.organizerId);
      } else if (tab === 2) { // Admins
        filtered = filtered.filter(user => 
          user.roleIds?.some(role => {
            if (typeof role === 'object') {
              return role.roleName === 'SystemAdmin' || 
                     role.roleName === 'RegionalAdmin' ||
                     role.roleNameCode === 'SYA' ||
                     role.roleNameCode === 'RGA';
            }
            // If it's a string, we need to check against the roles array
            if (typeof role === 'string') {
              const matchedRole = roles.find(r => r._id === role);
              return matchedRole && 
                     (matchedRole.roleName === 'SystemAdmin' || 
                      matchedRole.roleName === 'RegionalAdmin' ||
                      matchedRole.roleNameCode === 'SYA' ||
                      matchedRole.roleNameCode === 'RGA');
            }
            return false;
          })
        );
      }
      
      // Apply search term filtering
      if (term) {
        const lowerTerm = term.toLowerCase();
        filtered = filtered.filter(user => {
          try {
            // Add optional chaining for all properties to prevent null/undefined errors
            return (
              (user.displayName?.toLowerCase()?.includes(lowerTerm) || false) ||
              (user.email?.toLowerCase()?.includes(lowerTerm) || false) ||
              (user.roleNames?.toLowerCase()?.includes(lowerTerm) || false) ||
              (user.firebaseUserId?.toLowerCase()?.includes(lowerTerm) || false)
            );
          } catch (error) {
            console.error(`Error filtering user ${user.id || 'unknown'}:`, error);
            return false; // Skip this user on error
          }
        });
      }
      
      // Update pagination information
      setPagination(prev => ({
        ...prev,
        totalCount: filtered.length,
        page: 0 // Reset to first page on new search
      }));
      
      // Update filtered users
      setFilteredUsers(filtered);
    } catch (err) {
      console.error('Error in filterUsers:', err);
      // On error, reset to showing all users
      setFilteredUsers(users);
    }
  }, [users, searchTerm, tabValue, roles]);

  // Keep filtered users in sync with users, searchTerm, and tabValue
  useEffect(() => {
    filterUsers(searchTerm, tabValue);
  }, [users, searchTerm, tabValue, filterUsers]);

  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @returns {Object|undefined} User object or undefined if not found
   */
  const getUserById = useCallback((userId) => {
    if (!userId) return undefined;
    return users.find(user => user._id === userId || user.id === userId);
  }, [users]);

  /**
   * Create a new user with enhanced error handling
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Process input data
      const userDataWithAppId = {
        ...userData,
        appId
      };
      
      // Create user using Next.js API route
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userDataWithAppId)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      const createdUser = await response.json();
      
      // If the user requested to create an organizer, do that now
      if (userData.isOrganizer && createdUser.firebaseUserId) {
        await createOrganizerForUser(createdUser, userData);
      }
      
      // Refresh users list
      await fetchUsers(true);
      
      return createdUser;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchUsers]);

  /**
   * Helper function to create an organizer for a user
   * @param {Object} user - User object
   * @param {Object} userData - Original user data
   * @returns {Promise<Object>} Created organizer
   */
  const createOrganizerForUser = useCallback(async (user, userData) => {
    // Prepare organizer data
    const organizerData = {
      firebaseUserId: user.firebaseUserId,
      linkedUserLogin: user._id,
      appId: appId,
      fullName: `${userData.firstName || user.localUserInfo?.firstName} ${userData.lastName || user.localUserInfo?.lastName}`.trim(),
      shortName: userData.firstName || user.localUserInfo?.firstName,
      organizerRegion: userData.organizerRegion || "66c4d99042ec462ea22484bd", // US region default
      isActive: true,
      isEnabled: true,
      wantRender: true,
      organizerTypes: {
        isEventOrganizer: true,
        isVenue: false,
        isTeacher: false,
        isMaestro: false,
        isDJ: false,
        isOrchestra: false
      }
    };
    
    try {
      // Create the organizer
      const organizerResponse = await fetch('/api/organizers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(organizerData)
      });
      
      if (!organizerResponse.ok) {
        const errorData = await organizerResponse.json();
        throw new Error(errorData.message || 'Failed to create organizer');
      }
      
      const createdOrganizer = await organizerResponse.json();
      
      // Update user to include organizerId reference
      await usersApi.updateUser({
        firebaseUserId: user.firebaseUserId,
        appId: appId,
        regionalOrganizerInfo: {
          organizerId: createdOrganizer._id,
          isApproved: true,
          isEnabled: true,
          isActive: true
        }
      });
  
      // Add organizer role to the user
      const organizerRole = roles.find(role => 
        role.roleName === 'RegionalOrganizer' || 
        role.roleNameCode === 'RGO'
      );
      
      if (organizerRole) {
        // Get current roles
        const currentRoles = [...(user.roleIds || [])].map(role => 
          typeof role === 'object' ? role._id : role
        );
        
        // Add organizer role if not present
        if (!currentRoles.includes(organizerRole._id)) {
          currentRoles.push(organizerRole._id);
          await usersApi.updateUserRoles(user.firebaseUserId, currentRoles, appId);
        }
      }
      
      return createdOrganizer;
    } catch (err) {
      console.error('Error creating organizer for user:', err);
      throw err;
    }
  }, [appId, roles]);

  /**
   * Update an existing user with optimized error handling
   * @param {Object} userData - User data with updates
   * @returns {Promise<Object>} Updated user
   */
  const updateUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // First update general user information
      const userUpdateData = {
        firebaseUserId: userData.firebaseUserId,
        appId: userData.appId || appId,
        active: userData.active,
        localUserInfo: userData.localUserInfo,
        regionalOrganizerInfo: userData.regionalOrganizerInfo,
        // TODO: Backend doesn't handle regionalAdminInfo in updateUserInfo endpoint
        // This is a known issue - the backend needs to be updated to process regionalAdminInfo
        regionalAdminInfo: userData.regionalAdminInfo
      };
      
      // Debug logging for regionalAdminInfo
      console.log('Sending update to backend:', userUpdateData);
      if (userData.regionalAdminInfo) {
        console.log('LocalAdminInfo being sent:', JSON.stringify(userData.regionalAdminInfo, null, 2));
      }
      
      // Update user basic information
      await usersApi.updateUser(userUpdateData);
      
      // Update user roles separately if roleIds exists
      if (userData.roleIds) {
        const roleIds = [...userData.roleIds].map(role => 
          typeof role === 'object' ? role._id : role
        );
        await usersApi.updateUserRoles(userData.firebaseUserId, roleIds, appId);
      }
      
      // Refresh the users list
      await fetchUsers(true);
      
      // Find and return the updated user
      const updatedUser = users.find(u => u.firebaseUserId === userData.firebaseUserId);
      
      // Debug logging for the returned user
      if (updatedUser && updatedUser.regionalAdminInfo) {
        console.log('LocalAdminInfo after update:', JSON.stringify(updatedUser.regionalAdminInfo, null, 2));
      }
      
      return updatedUser || userData;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchUsers, users]);

  /**
   * Delete a user with careful handling of organizer relationships
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  const deleteUser = useCallback(async (userId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the user to check for organizer connection
      const user = getUserById(userId);
      
      if (user && user.regionalOrganizerInfo?.organizerId) {
        // If user has an organizer connection, first remove that connection to prevent orphaned references
        try {
          // Get the organizer ID (handling both string and object formats)
          const organizerId = typeof user.regionalOrganizerInfo.organizerId === 'object'
            ? user.regionalOrganizerInfo.organizerId._id
            : user.regionalOrganizerInfo.organizerId;
          
          // Update the organizer to remove user references
          await fetch(`/api/organizers/${organizerId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firebaseUserId: null,
              linkedUserLogin: null,
              appId: appId
            })
          });
        } catch (organizerError) {
          console.error('Error disconnecting user from organizer:', organizerError);
          // Continue with user deletion even if organizer update fails
        }
      }
      
      // Delete the user
      await usersApi.deleteUser(userId, appId);
      
      // Refresh users list
      await fetchUsers(true);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchUsers, getUserById]);

  /**
   * Reset filters to their initial state
   */
  const resetFilters = useCallback(() => {
    setSearchTerm(options.initialFilters?.searchTerm || '');
    setTabValue(options.initialFilters?.tabValue || 0);
  }, [options.initialFilters]);

  // Memoize the public API to prevent unnecessary re-renders
  const api = useMemo(() => ({
    // Data
    users,
    filteredUsers,
    loading,
    error,
    
    // Filters
    searchTerm,
    setSearchTerm,
    tabValue,
    setTabValue,
    filterUsers,
    resetFilters,
    
    // Pagination
    pagination,
    setPagination,
    
    // Operations
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    createOrganizerForUser
  }), [
    users, 
    filteredUsers, 
    loading, 
    error, 
    searchTerm, 
    tabValue, 
    pagination,
    fetchUsers,
    filterUsers,
    resetFilters,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    createOrganizerForUser,
    setPagination,
    setSearchTerm,
    setTabValue
  ]);

  return api;
};

export default useUsers;