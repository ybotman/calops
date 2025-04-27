'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import useRoles from './useRoles';

/**
 * Custom hook for filtering users
 * @param {Object} options - Hook options
 * @param {Array} options.users - Array of users to filter
 * @param {Object} [options.initialFilters] - Initial filter values
 * @param {string} [options.initialFilters.searchTerm] - Initial search term
 * @param {number} [options.initialFilters.tabValue] - Initial tab value
 * @param {Object} [options.initialFilters.customFilters] - Initial custom filters
 * @param {number} [options.debounceMs] - Debounce time for search in milliseconds
 * @returns {Object} Filtering state and operations
 */
const useUserFilter = ({ users = [], initialFilters = {}, debounceMs = 300 }) => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [tabValue, setTabValue] = useState(initialFilters.tabValue || 0);
  const [customFilters, setCustomFilters] = useState(initialFilters.customFilters || {});
  
  // Get roles data for role-based filtering
  const { hasAdminRole, hasOrganizerRole } = useRoles();
  
  // Set up debounce for search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);
  
  /**
   * Apply tab-based filtering
   * @param {Array} userList - Users array to filter
   * @param {number} tab - Tab value
   * @returns {Array} Filtered users
   */
  const applyTabFilter = useCallback((userList, tab) => {
    if (!Array.isArray(userList) || userList.length === 0) {
      return [];
    }
    
    if (tab === 0) {
      // All users tab - no filtering
      return userList;
    }
    
    if (tab === 1) {
      // Organizers tab - filter by organizer status or role
      return userList.filter(user => 
        user.regionalOrganizerInfo?.organizerId || 
        hasOrganizerRole(user.roleIds)
      );
    }
    
    if (tab === 2) {
      // Admins tab - filter by admin roles
      return userList.filter(user => hasAdminRole(user.roleIds));
    }
    
    // Default - no filtering
    return userList;
  }, [hasAdminRole, hasOrganizerRole]);

  /**
   * Apply search term filtering
   * @param {Array} userList - Users array to filter
   * @param {string} term - Search term
   * @returns {Array} Filtered users
   */
  const applySearchFilter = useCallback((userList, term) => {
    if (!Array.isArray(userList) || userList.length === 0 || !term) {
      return userList;
    }
    
    const lowerTerm = term.toLowerCase();
    return userList.filter(user => {
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
  }, []);

  /**
   * Apply custom filters
   * @param {Array} userList - Users array to filter
   * @param {Object} filters - Custom filters object
   * @returns {Array} Filtered users
   */
  const applyCustomFilters = useCallback((userList, filters) => {
    if (!Array.isArray(userList) || userList.length === 0 || !filters || Object.keys(filters).length === 0) {
      return userList;
    }
    
    let filtered = [...userList];
    
    // Apply each custom filter
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      filtered = filtered.filter(user => {
        try {
          // Handle special cases
          if (key === 'isActive') {
            return user.active === value;
          }
          
          if (key === 'isOrganizer') {
            return value === !!user.regionalOrganizerInfo?.organizerId;
          }
          
          if (key === 'isAdmin') {
            return value === hasAdminRole(user.roleIds);
          }
          
          if (key === 'hasRole') {
            // value should be a role ID or array of role IDs
            const roleIdsToCheck = Array.isArray(value) ? value : [value];
            const userRoleIds = user.roleIds?.map(r => 
              typeof r === 'object' ? r._id : r
            ) || [];
            
            return roleIdsToCheck.some(roleId => userRoleIds.includes(roleId));
          }
          
          // Handle deeply nested properties
          if (key.includes('.')) {
            return key.split('.').reduce((obj, prop, index, parts) => {
              // Last part is the value to compare
              if (index === parts.length - 1) {
                return obj?.[prop] === value;
              }
              // Navigate through the object
              return obj?.[prop];
            }, user);
          }
          
          // Handle regular properties
          return user[key] === value;
        } catch (error) {
          console.error(`Error applying filter ${key} to user ${user.id || 'unknown'}:`, error);
          return true; // Skip this filter on error
        }
      });
    });
    
    return filtered;
  }, [hasAdminRole]);

  /**
   * Apply all filters to the users array
   * @param {Array} [userList] - Users array to filter (defaults to users prop)
   * @returns {Array} Filtered users
   */
  const applyFilters = useCallback((userList = users) => {
    try {
      if (!Array.isArray(userList) || userList.length === 0) {
        return [];
      }
      
      // Apply filters in sequence
      let filtered = [...userList];
      
      // 1. Apply tab filter
      filtered = applyTabFilter(filtered, tabValue);
      
      // 2. Apply search filter
      filtered = applySearchFilter(filtered, debouncedSearchTerm);
      
      // 3. Apply custom filters
      filtered = applyCustomFilters(filtered, customFilters);
      
      return filtered;
    } catch (error) {
      console.error('Error applying filters:', error);
      return [];
    }
  }, [
    users, 
    tabValue, 
    debouncedSearchTerm, 
    customFilters, 
    applyTabFilter, 
    applySearchFilter, 
    applyCustomFilters
  ]);
  
  // Get filtered users with memoization
  const filteredUsers = useMemo(() => {
    return applyFilters(users);
  }, [users, applyFilters]);
  
  /**
   * Add a custom filter
   * @param {string} key - Filter key
   * @param {any} value - Filter value
   */
  const addFilter = useCallback((key, value) => {
    setCustomFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  /**
   * Remove a custom filter
   * @param {string} key - Filter key to remove
   */
  const removeFilter = useCallback((key) => {
    setCustomFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);
  
  /**
   * Clear all filters
   * @param {Object} [options] - Clear options
   * @param {boolean} [options.keepTab=false] - Whether to keep tab selection
   * @param {boolean} [options.keepSearch=false] - Whether to keep search term
   */
  const clearFilters = useCallback(({ keepTab = false, keepSearch = false } = {}) => {
    if (!keepSearch) {
      setSearchTerm('');
    }
    
    if (!keepTab) {
      setTabValue(0);
    }
    
    setCustomFilters({});
  }, []);
  
  /**
   * Reset to initial filters
   */
  const resetFilters = useCallback(() => {
    setSearchTerm(initialFilters.searchTerm || '');
    setTabValue(initialFilters.tabValue || 0);
    setCustomFilters(initialFilters.customFilters || {});
  }, [initialFilters]);
  
  // Memoize the return value to prevent unnecessary rerenders
  const api = useMemo(() => ({
    // Results
    filteredUsers,
    
    // Filter state
    searchTerm,
    tabValue,
    customFilters,
    
    // Setters
    setSearchTerm,
    setTabValue,
    
    // Filter operations
    addFilter,
    removeFilter,
    clearFilters,
    resetFilters,
    
    // Utilities
    applyFilters,
    applyTabFilter,
    applySearchFilter,
    applyCustomFilters
  }), [
    filteredUsers,
    searchTerm,
    tabValue,
    customFilters,
    setSearchTerm,
    setTabValue,
    addFilter,
    removeFilter,
    clearFilters,
    resetFilters,
    applyFilters,
    applyTabFilter,
    applySearchFilter,
    applyCustomFilters
  ]);
  
  return api;
};

export default useUserFilter;