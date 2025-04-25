'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for filtering users
 * @param {Object} options - Hook options
 * @param {Array} options.users - Users to filter
 * @param {Object} [options.initialFilters] - Initial filter state
 * @returns {Object} Filtering state and operations
 */
const useUserFilter = ({ users = [], initialFilters = {} }) => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const [tabValue, setTabValue] = useState(initialFilters.tabValue || 0);
  const [customFilters, setCustomFilters] = useState(initialFilters.customFilters || {});
  
  // Function to apply all filters
  const applyFilters = useCallback((userList) => {
    if (!Array.isArray(userList) || userList.length === 0) {
      return [];
    }
    
    let filtered = [...userList];
    
    // Apply tab filtering
    if (tabValue === 1) { // Organizers
      filtered = filtered.filter(user => user.regionalOrganizerInfo?.organizerId);
    } else if (tabValue === 2) { // Admins
      filtered = filtered.filter(user => 
        user.roleIds?.some(role => 
          (typeof role === 'object' && 
           (role.roleName === 'SystemAdmin' || role.roleName === 'RegionalAdmin'))
        )
      );
    }
    
    // Apply search term filtering
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        try {
          return (
            (user.displayName?.toLowerCase()?.includes(lowerTerm) || false) ||
            (user.email?.toLowerCase()?.includes(lowerTerm) || false) ||
            (user.roleNames?.toLowerCase()?.includes(lowerTerm) || false) ||
            (user.firebaseUserId?.toLowerCase()?.includes(lowerTerm) || false)
          );
        } catch (error) {
          console.error(`Error filtering user ${user.id || 'unknown'}:`, error);
          return false;
        }
      });
    }
    
    // Apply custom filters
    Object.entries(customFilters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      filtered = filtered.filter(user => {
        // Handle nested properties (e.g., 'localUserInfo.isActive')
        if (key.includes('.')) {
          const [parent, child] = key.split('.');
          return user[parent]?.[child] === value;
        }
        
        // Handle regular properties
        return user[key] === value;
      });
    });
    
    return filtered;
  }, [tabValue, searchTerm, customFilters]);
  
  // Get filtered users
  const filteredUsers = useMemo(() => {
    return applyFilters(users);
  }, [users, applyFilters]);
  
  // Add a custom filter
  const addFilter = useCallback((key, value) => {
    setCustomFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  // Remove a custom filter
  const removeFilter = useCallback((key) => {
    setCustomFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setTabValue(0);
    setCustomFilters({});
  }, []);
  
  // Reset to initial filters
  const resetFilters = useCallback(() => {
    setSearchTerm(initialFilters.searchTerm || '');
    setTabValue(initialFilters.tabValue || 0);
    setCustomFilters(initialFilters.customFilters || {});
  }, [initialFilters]);
  
  return {
    // State
    filteredUsers,
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
    resetFilters
  };
};

export default useUserFilter;