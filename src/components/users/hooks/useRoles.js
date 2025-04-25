'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { rolesApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';

/**
 * Custom hook for fetching and managing roles
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID (default: from AppContext)
 * @returns {Object} Roles data and operations
 */
const useRoles = (options = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const appId = options.appId || currentApp.id;
  
  // State for roles data
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetch roles from the API
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @returns {Promise<Array>} Fetched roles
   */
  const fetchRoles = useCallback(async (forceRefresh = false) => {
    // Skip fetch if we have roles and aren't forcing a refresh
    if (roles.length > 0 && !forceRefresh && lastUpdated) {
      // Only use cached data if it's less than 5 minutes old
      const cacheAge = Date.now() - lastUpdated;
      if (cacheAge < 5 * 60 * 1000) { // 5 minutes in milliseconds
        return roles;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch roles from API
      const rolesData = await rolesApi.getRoles(appId);
      
      // Process roles to ensure they have roleNameCode
      const processedRoles = Array.isArray(rolesData) ? rolesData.map(role => {
        // Ensure roleNameCode exists, generate one if it doesn't
        if (!role.roleNameCode && role.roleName) {
          return { 
            ...role, 
            roleNameCode: role.roleName.substring(0, 2).toUpperCase() 
          };
        }
        return role;
      }) : [];
      
      setRoles(processedRoles);
      setLastUpdated(Date.now());
      return processedRoles;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [appId, roles, lastUpdated]);

  // Fetch roles on mount and when appId changes
  useEffect(() => {
    fetchRoles();
  }, [fetchRoles, appId]);

  /**
   * Update roles for a user
   * @param {string} firebaseUserId - Firebase user ID
   * @param {Array<string>} roleIds - Array of role IDs
   * @returns {Promise<void>}
   */
  const updateUserRoles = useCallback(async (firebaseUserId, roleIds) => {
    try {
      setLoading(true);
      setError(null);
      await rolesApi.updateUserRoles(firebaseUserId, roleIds, appId);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId]);

  /**
   * Get role name by ID
   * @param {string} roleId - Role ID
   * @returns {string} Role name or empty string if not found
   */
  const getRoleNameById = useCallback((roleId) => {
    if (!roleId) return '';
    
    const role = roles.find(r => String(r._id).trim() === String(roleId).trim());
    return role ? role.roleName : '';
  }, [roles]);

  /**
   * Get role name code by ID
   * @param {string} roleId - Role ID
   * @returns {string} Role name code or empty string if not found
   */
  const getRoleNameCodeById = useCallback((roleId) => {
    if (!roleId) return '';
    
    const role = roles.find(r => String(r._id).trim() === String(roleId).trim());
    return role ? role.roleNameCode : '';
  }, [roles]);

  /**
   * Process role IDs to role name codes
   * @param {Array} roleIds - Array of role IDs (can be string or objects)
   * @returns {string} Comma-separated role name codes
   */
  const processRoleIds = useCallback((roleIds) => {
    if (!Array.isArray(roleIds) || roleIds.length === 0) return '';
    
    const roleCodes = roleIds.map(roleId => {
      // Handle case where roleId is already an object with roleNameCode
      if (typeof roleId === 'object' && roleId.roleNameCode) {
        return roleId.roleNameCode;
      }
      
      // Handle case where roleId is an object with _id property
      const idStr = typeof roleId === 'object' && roleId._id 
        ? String(roleId._id).trim() 
        : String(roleId).trim();
      
      // Find matching role
      const role = roles.find(r => String(r._id).trim() === idStr);
      
      // Return roleNameCode if found, otherwise '?'
      return role?.roleNameCode || '?';
    });
    
    return roleCodes.join(', ');
  }, [roles]);

  // Check if a role exists in a user's roles by name
  const hasRole = useCallback((user, roleName) => {
    if (!user || !user.roleIds || !roleName) return false;
    
    // Find role by name
    const role = roles.find(r => r.roleName === roleName);
    if (!role) return false;
    
    // Check if user has this role
    const roleId = String(role._id).trim();
    return user.roleIds.some(r => {
      if (typeof r === 'object' && r._id) {
        return String(r._id).trim() === roleId;
      }
      return String(r).trim() === roleId;
    });
  }, [roles]);

  // Get admin roles (memoized)
  const adminRoles = useMemo(() => {
    return roles.filter(role => 
      role.roleName === 'SystemAdmin' || 
      role.roleName === 'RegionalAdmin' ||
      role.roleName === 'LocalAdmin'
    );
  }, [roles]);

  // Get organizer role (memoized)
  const organizerRole = useMemo(() => {
    return roles.find(role => role.roleName === 'RegionalOrganizer');
  }, [roles]);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    updateUserRoles,
    getRoleNameById,
    getRoleNameCodeById,
    processRoleIds,
    hasRole,
    adminRoles,
    organizerRole,
  };
};

export default useRoles;