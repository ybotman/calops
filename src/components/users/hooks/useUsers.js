'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usersApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';
import useRoles from './useRoles';

/**
 * Custom hook for fetching and managing users
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID (default: from AppContext)
 * @param {Object} [options.initialFilters] - Initial filter settings
 * @returns {Object} Users data and operations
 */
const useUsers = (options = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const appId = options.appId || currentApp.id;
  
  // Get roles data
  const { roles, processRoleIds } = useRoles({ appId });
  
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
      
      return {
        ...user,
        id: user._id, // For DataGrid key
        displayName: `${user.localUserInfo?.firstName || ''} ${user.localUserInfo?.lastName || ''}`.trim() || 'Unnamed User',
        email: user.firebaseUserInfo?.email || 'No email',
        roleNames: roleNamesStr || '',
        isApproved: user.localUserInfo?.isApproved ? 'Yes' : 'No',
        isEnabled: user.localUserInfo?.isEnabled ? 'Yes' : 'No',
        isOrganizer: user.regionalOrganizerInfo?.organizerId ? 'Yes' : 'No',
        hasOrganizerId: !!user.regionalOrganizerInfo?.organizerId,
        localUserInfo: user.localUserInfo || {},
        regionalOrganizerInfo: user.regionalOrganizerInfo || {},
        localAdminInfo: user.localAdminInfo || {},
      };
    });
  }, [processRoleIds]);

  /**
   * Fetch users from the API
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @returns {Promise<Array>} Fetched and processed users
   */
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    // Skip fetch if we have users and aren't forcing a refresh
    if (users.length > 0 && !forceRefresh && lastUpdated) {
      // Only use cached data if it's less than 2 minutes old
      const cacheAge = Date.now() - lastUpdated;
      if (cacheAge < 2 * 60 * 1000) { // 2 minutes in milliseconds
        return users;
      }
    }

    try {
      setLoading(true);
      setError(null);
      
      // Add timestamp to force fresh data
      const timestamp = Date.now();
      
      // Fetch users from API
      const usersData = await usersApi.getUsers(appId, undefined, timestamp);
      
      // Process users data
      const processedUsers = processUsers(usersData);
      
      // Update state
      setUsers(processedUsers);
      setLastUpdated(Date.now());
      
      // Update pagination total count
      setPagination(prev => ({
        ...prev,
        totalCount: processedUsers.length
      }));
      
      return processedUsers;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [appId, users, lastUpdated, processUsers]);

  // Fetch users on mount and when appId changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, appId]);

  /**
   * Filter users based on search term and current tab
   * @param {string} [term] - Search term to filter by (defaults to current searchTerm)
   * @param {number} [tab] - Tab value to filter by (defaults to current tabValue)
   */
  const filterUsers = useCallback((term = searchTerm, tab = tabValue) => {
    let filtered = users;
    
    // Apply tab filtering
    if (tab === 1) { // Organizers
      filtered = filtered.filter(user => user.regionalOrganizerInfo?.organizerId);
    } else if (tab === 2) { // Admins
      filtered = filtered.filter(user => 
        user.roleIds?.some(role => 
          (typeof role === 'object' && 
           (role.roleName === 'SystemAdmin' || role.roleName === 'RegionalAdmin'))
        )
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
  }, [users, searchTerm, tabValue]);

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
    return users.find(user => user._id === userId || user.id === userId);
  }, [users]);

  /**
   * Create a new user
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
      
      // Create user using local API endpoint
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
        // Prepare organizer data
        const organizerData = {
          firebaseUserId: createdUser.firebaseUserId,
          linkedUserLogin: createdUser._id,
          appId: appId,
          fullName: `${userData.firstName} ${userData.lastName}`.trim(),
          shortName: userData.firstName,
          organizerRegion: "66c4d99042ec462ea22484bd", // US region default
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
        
        // Create the organizer
        const organizerResponse = await fetch('/api/organizers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(organizerData)
        });
        
        if (!organizerResponse.ok) {
          console.warn('Created user but failed to create organizer');
        } else {
          const organizerData = await organizerResponse.json();
          
          // Update user to include organizerId reference
          await usersApi.updateUser({
            firebaseUserId: createdUser.firebaseUserId,
            appId: appId,
            regionalOrganizerInfo: {
              organizerId: organizerData._id,
              isApproved: true,
              isEnabled: true,
              isActive: true
            }
          });
        }
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
   * Update an existing user
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
        localAdminInfo: userData.localAdminInfo
      };
      
      // Update user basic information
      await usersApi.updateUser(userUpdateData);
      
      // Update user roles separately if roleIds exists
      if (userData.roleIds) {
        const roleIds = [...userData.roleIds];
        await usersApi.updateUserRoles(userData.firebaseUserId, roleIds, appId);
      }
      
      // Refresh the users list
      await fetchUsers(true);
      
      // Find and return the updated user
      const updatedUser = users.find(u => u.firebaseUserId === userData.firebaseUserId);
      return updatedUser || userData;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchUsers, users]);

  /**
   * Delete a user
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

  return {
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
    
    // Pagination
    pagination,
    setPagination,
    
    // Operations
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
  };
};

export default useUsers;