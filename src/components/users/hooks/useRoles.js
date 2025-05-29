'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { rolesApi, usersApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';

/**
 * Custom hook for fetching and managing roles data
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID (default: from AppContext)
 * @param {Object} [options.cacheOptions] - Cache configuration
 * @param {number} [options.cacheOptions.maxAge] - Maximum cache age in ms (default: 5 minutes)
 * @returns {Object} Roles data and operations
 */
const useRoles = (options = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const appId = options.appId || currentApp?.id || '1';
  
  // Cache configuration with defaults
  const cacheOptions = {
    maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
    ...(options.cacheOptions || {})
  };
  
  // State for roles data
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch roles from the API with error handling and retries
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @param {number} [retryCount=0] - Current retry attempt count
   * @returns {Promise<Array>} Fetched roles
   */
  const fetchRoles = useCallback(async (forceRefresh = false, retryCount = 0) => {
    // Skip fetch if we have fresh cached data and aren't forcing a refresh
    if (!forceRefresh && lastUpdated) {
      // Only use cached data if it's less than the configured cache age
      const cacheAge = Date.now() - lastUpdated;
      if (cacheAge < cacheOptions.maxAge) {
        return roles;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch roles from API with retry logic
      let rolesData;
      try {
        rolesData = await rolesApi.getRoles(appId);
      } catch (fetchError) {
        // Implement retry logic for transient network issues
        if (retryCount < 2) { // Allow up to 2 retries (3 attempts total)
          console.warn(`Error fetching roles, retrying (attempt ${retryCount + 1}/3)...`, fetchError);
          // Exponential backoff: 1s, then 2s
          const delay = 1000 * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchRoles(forceRefresh, retryCount + 1);
        }
        throw fetchError; // Re-throw if we've exhausted retries
      }
      
      // Update state
      setRoles(rolesData);
      setLastUpdated(Date.now());
      return rolesData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error(`Error fetching roles: ${errorMessage}`, err);
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [appId, lastUpdated, cacheOptions.maxAge]);

  // Fetch roles on component mount and when appId changes
  useEffect(() => {
    // Only fetch if we don't have fresh cached data
    const cacheAge = lastUpdated ? Date.now() - lastUpdated : Infinity;
    if (cacheAge > cacheOptions.maxAge || !lastUpdated) {
      // Call fetchRoles directly to avoid dependency loop
      (async () => {
        try {
          setLoading(true);
          setError(null);
          const rolesData = await rolesApi.getRoles(appId);
          setRoles(rolesData);
          setLastUpdated(Date.now());
        } catch (err) {
          const errorMessage = err.response?.data?.message || err.message;
          console.error(`Error fetching roles: ${errorMessage}`, err);
          setError(err);
          setRoles([]);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [appId, lastUpdated, cacheOptions.maxAge]);

  /**
   * Process role IDs to a consistent string format for display
   * @param {Array} roleIds - Array of role IDs (can be strings or objects)
   * @returns {string} Comma-separated list of role name codes
   */
  const processRoleIds = useCallback((roleIds) => {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return '';
    }

    // If roles array is empty (still loading), return loading indicator
    if (roles.length === 0) {
      return '...';
    }

    // Handle the case where roleIds contains objects with _id field
    const roleNameCodes = roleIds.map(roleId => {
      try {
        // If roleId is an object with roleNameCode, use that directly
        if (roleId && typeof roleId === 'object' && roleId.roleNameCode) {
          return roleId.roleNameCode;
        }
        
        // If roleId is an object with _id, look it up in roles array
        if (roleId && typeof roleId === 'object' && roleId._id) {
          const role = roles.find(r => r._id === roleId._id);
          return role ? role.roleNameCode : 'UNK';
        }
        
        // If roleId is a string ID, look it up in roles array
        if (typeof roleId === 'string') {
          const role = roles.find(r => r._id === roleId);
          return role ? role.roleNameCode : 'UNK';
        }
        
        return 'UNK'; // Unknown format
      } catch (err) {
        console.error('Error processing role ID:', err, roleId);
        return 'ERR';
      }
    });
    
    // Filter out empty values and join with commas
    return roleNameCodes.filter(code => code).join(', ');
  }, [roles]);

  /**
   * Get a role by ID
   * @param {string} roleId - Role ID
   * @returns {Object|undefined} Role object or undefined if not found
   */
  const getRoleById = useCallback((roleId) => {
    if (!roleId) return undefined;
    return roles.find(role => role._id === roleId);
  }, [roles]);

  /**
   * Get a role name by ID
   * @param {string} roleId - Role ID
   * @returns {string} Role name or empty string if not found
   */
  const getRoleNameById = useCallback((roleId) => {
    const role = getRoleById(roleId);
    return role ? role.roleName : '';
  }, [getRoleById]);

  /**
   * Get a role name code by ID
   * @param {string} roleId - Role ID
   * @returns {string} Role name code or empty string if not found
   */
  const getRoleNameCodeById = useCallback((roleId) => {
    const role = getRoleById(roleId);
    return role ? role.roleNameCode : '';
  }, [getRoleById]);

  /**
   * Update roles for a user
   * @param {string} firebaseUserId - Firebase user ID
   * @param {Array<string>} roleIds - Array of role IDs
   * @param {string} [userAppId] - Application ID (defaults to hook's appId)
   * @returns {Promise<Object>} Updated user
   */
  const updateUserRoles = useCallback(async (firebaseUserId, roleIds, userAppId = appId) => {
    try {
      setLoading(true);
      
      // Normalize roleIds (ensure they're strings)
      const normalizedRoleIds = roleIds.map(roleId => 
        typeof roleId === 'object' ? roleId._id : roleId
      );
      
      // Update roles
      const result = await usersApi.updateUserRoles(firebaseUserId, normalizedRoleIds, userAppId);
      return result;
    } catch (err) {
      console.error('Error updating user roles:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId]);

  /**
   * Determine if a role array contains an admin role
   * @param {Array} roleIds - Array of role IDs (can be strings or objects) 
   * @returns {boolean} True if user has admin role
   */
  const hasAdminRole = useCallback((roleIds) => {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return false;
    }

    return roleIds.some(roleId => {
      try {
        // Handle object with roleName directly
        if (roleId && typeof roleId === 'object' && roleId.roleName) {
          return roleId.roleName === 'SystemAdmin' || 
                 roleId.roleName === 'RegionalAdmin' ||
                 roleId.roleNameCode === 'SYA' ||
                 roleId.roleNameCode === 'RGA';
        }
        
        // Handle object with _id
        if (roleId && typeof roleId === 'object' && roleId._id) {
          const role = roles.find(r => r._id === roleId._id);
          return role && (
            role.roleName === 'SystemAdmin' || 
            role.roleName === 'RegionalAdmin' ||
            role.roleNameCode === 'SYA' ||
            role.roleNameCode === 'RGA'
          );
        }
        
        // Handle string ID
        if (typeof roleId === 'string') {
          const role = roles.find(r => r._id === roleId);
          return role && (
            role.roleName === 'SystemAdmin' || 
            role.roleName === 'RegionalAdmin' ||
            role.roleNameCode === 'SYA' ||
            role.roleNameCode === 'RGA'
          );
        }
        
        return false;
      } catch (err) {
        console.error('Error checking admin role:', err);
        return false;
      }
    });
  }, [roles]);

  /**
   * Determine if a role array contains an organizer role
   * @param {Array} roleIds - Array of role IDs (can be strings or objects)
   * @returns {boolean} True if user has organizer role
   */
  const hasOrganizerRole = useCallback((roleIds) => {
    if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0) {
      return false;
    }

    return roleIds.some(roleId => {
      try {
        // Handle object with roleName directly
        if (roleId && typeof roleId === 'object' && roleId.roleName) {
          return roleId.roleName === 'RegionalOrganizer' || 
                 roleId.roleNameCode === 'RGO';
        }
        
        // Handle object with _id
        if (roleId && typeof roleId === 'object' && roleId._id) {
          const role = roles.find(r => r._id === roleId._id);
          return role && (
            role.roleName === 'RegionalOrganizer' || 
            role.roleNameCode === 'RGO'
          );
        }
        
        // Handle string ID
        if (typeof roleId === 'string') {
          const role = roles.find(r => r._id === roleId);
          return role && (
            role.roleName === 'RegionalOrganizer' || 
            role.roleNameCode === 'RGO'
          );
        }
        
        return false;
      } catch (err) {
        console.error('Error checking organizer role:', err);
        return false;
      }
    });
  }, [roles]);

  // Memoize the public API to prevent unnecessary re-renders
  const api = useMemo(() => ({
    // Data
    roles,
    loading,
    error,
    
    // Operations
    fetchRoles,
    getRoleById,
    getRoleNameById,
    getRoleNameCodeById,
    updateUserRoles,
    
    // Utilities
    processRoleIds,
    hasAdminRole,
    hasOrganizerRole
  }), [
    roles,
    loading,
    error,
    fetchRoles,
    getRoleById,
    getRoleNameById,
    getRoleNameCodeById,
    updateUserRoles,
    processRoleIds,
    hasAdminRole,
    hasOrganizerRole
  ]);

  return api;
};

export default useRoles;