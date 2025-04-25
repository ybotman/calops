'use client';

import { useState, useCallback } from 'react';
import { usersApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';
import useRoles from './useRoles';

/**
 * Custom hook for organizer-related actions
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID
 * @param {Function} [options.onSuccess] - Success callback
 * @param {Function} [options.refreshUsers] - Function to refresh users after actions
 * @returns {Object} Organizer actions and state
 */
const useOrganizerActions = ({ appId, onSuccess, refreshUsers } = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const activeAppId = appId || currentApp.id;
  
  // Get roles data to add organizer role
  const { roles } = useRoles({ appId: activeAppId });
  
  // State for managing operations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  
  /**
   * Create an organizer for a user
   * @param {Object} user - User to create organizer for
   * @returns {Promise<Object>} Created organizer
   */
  const createOrganizer = useCallback(async (user) => {
    try {
      setSelectedUser(user);
      setLoading(true);
      setError(null);
      
      // Use the existing user's Firebase ID
      const fullName = `${user.localUserInfo?.firstName || ''} ${user.localUserInfo?.lastName || ''}`.trim() || 'Unnamed Organizer';
      const shortName = user.localUserInfo?.firstName || 'Unnamed';
      
      const organizerData = {
        firebaseUserId: user.firebaseUserId,
        linkedUserLogin: user._id,
        appId: user.appId || activeAppId,
        fullName: fullName,
        name: fullName, // Add name as well to ensure it's displayed in lists
        shortName: shortName,
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
      const response = await fetch('/api/organizers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(organizerData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create organizer');
      }
      
      const createdOrganizer = await response.json();
      
      // Update user to include organizerId reference and organizer role
      const userUpdateData = {
        firebaseUserId: user.firebaseUserId,
        appId: user.appId || activeAppId,
        regionalOrganizerInfo: {
          ...user.regionalOrganizerInfo,
          organizerId: createdOrganizer.organizer?._id || createdOrganizer._id,
          isApproved: true,
          isEnabled: true,
          isActive: true
        }
      };
      
      // Update user
      await usersApi.updateUser(userUpdateData);
      
      // Find organizer role
      const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
      if (organizerRole) {
        const roleIds = [...(user.roleIds || [])];
        const roleObjectIds = roleIds.map(role => 
          typeof role === 'object' ? role._id : role
        );
        
        // Add organizer role if not already present
        if (!roleObjectIds.includes(organizerRole._id)) {
          roleObjectIds.push(organizerRole._id);
          await usersApi.updateUserRoles(user.firebaseUserId, roleObjectIds, user.appId || activeAppId);
        }
      }
      
      // Refresh users if callback provided
      if (typeof refreshUsers === 'function') {
        await refreshUsers(true);
      }
      
      // Call success callback if provided
      if (typeof onSuccess === 'function') {
        onSuccess('createOrganizer', { ...user, isOrganizer: 'Yes', hasOrganizerId: true });
      }
      
      return createdOrganizer;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  }, [activeAppId, roles, refreshUsers, onSuccess]);
  
  /**
   * Delete an organizer
   * @param {Object} user - User whose organizer should be deleted
   * @returns {Promise<void>}
   */
  const deleteOrganizer = useCallback(async (user) => {
    try {
      if (!user.regionalOrganizerInfo?.organizerId) {
        throw new Error('This user does not have an organizer to delete.');
      }
      
      setSelectedUser(user);
      setLoading(true);
      setError(null);
      
      // First, disconnect the organizer from the user
      const userUpdateData = {
        firebaseUserId: user.firebaseUserId,
        appId: user.appId || activeAppId,
        regionalOrganizerInfo: {
          ...user.regionalOrganizerInfo,
          organizerId: null, // Remove the organizer reference
          isApproved: false,
          isEnabled: false,
          isActive: false
        }
      };
      
      // Update user to remove organizer connection
      await usersApi.updateUser(userUpdateData);
      
      // Now delete the organizer
      let organizerId = user.regionalOrganizerInfo.organizerId;
      if (typeof organizerId === 'object') {
        // Handle the case where organizerId is an object with _id
        organizerId = organizerId._id;
      }
      
      // Delete the organizer
      const response = await fetch(`/api/organizers/${organizerId}?appId=${user.appId || activeAppId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete organizer');
      }
      
      // Remove organizer role from user
      const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
      if (organizerRole) {
        const roleIds = [...(user.roleIds || [])];
        const roleObjectIds = roleIds.map(role => 
          typeof role === 'object' ? role._id : role
        ).filter(id => id !== organizerRole._id);
        
        await usersApi.updateUserRoles(user.firebaseUserId, roleObjectIds, user.appId || activeAppId);
      }
      
      // Refresh users if callback provided
      if (typeof refreshUsers === 'function') {
        await refreshUsers(true);
      }
      
      // Call success callback if provided
      if (typeof onSuccess === 'function') {
        onSuccess('deleteOrganizer', { ...user, isOrganizer: 'No', hasOrganizerId: false });
      }
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  }, [activeAppId, roles, refreshUsers, onSuccess]);
  
  /**
   * Connect user to an existing organizer
   * @param {Object} user - User to connect
   * @param {string} organizerId - Organizer ID to connect to
   * @returns {Promise<Object>} Updated user
   */
  const connectUserToOrganizer = useCallback(async (user, organizerId) => {
    try {
      setSelectedUser(user);
      setLoading(true);
      setError(null);
      
      // Connect user to organizer
      const response = await fetch(`/api/organizers/${organizerId}/connect-user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUserId: user.firebaseUserId,
          appId: user.appId || activeAppId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect user to organizer');
      }
      
      // Update user with organizer reference
      const userUpdateData = {
        firebaseUserId: user.firebaseUserId,
        appId: user.appId || activeAppId,
        regionalOrganizerInfo: {
          ...user.regionalOrganizerInfo,
          organizerId: organizerId,
          isApproved: true,
          isEnabled: true,
          isActive: true
        }
      };
      
      await usersApi.updateUser(userUpdateData);
      
      // Add organizer role
      const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
      if (organizerRole) {
        const roleIds = [...(user.roleIds || [])];
        const roleObjectIds = roleIds.map(role => 
          typeof role === 'object' ? role._id : role
        );
        
        // Add organizer role if not already present
        if (!roleObjectIds.includes(organizerRole._id)) {
          roleObjectIds.push(organizerRole._id);
          await usersApi.updateUserRoles(user.firebaseUserId, roleObjectIds, user.appId || activeAppId);
        }
      }
      
      // Refresh users if callback provided
      if (typeof refreshUsers === 'function') {
        await refreshUsers(true);
      }
      
      // Call success callback if provided
      if (typeof onSuccess === 'function') {
        onSuccess('connectOrganizer', { ...user, isOrganizer: 'Yes', hasOrganizerId: true });
      }
      
      return user;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  }, [activeAppId, roles, refreshUsers, onSuccess]);
  
  /**
   * Disconnect user from organizer without deleting the organizer
   * @param {Object} user - User to disconnect
   * @returns {Promise<Object>} Updated user
   */
  const disconnectUserFromOrganizer = useCallback(async (user) => {
    try {
      if (!user.regionalOrganizerInfo?.organizerId) {
        throw new Error('This user is not connected to an organizer.');
      }
      
      setSelectedUser(user);
      setLoading(true);
      setError(null);
      
      // Get the organizer ID
      let organizerId = user.regionalOrganizerInfo.organizerId;
      if (typeof organizerId === 'object') {
        organizerId = organizerId._id;
      }
      
      // Update the organizer to remove user references
      await fetch(`/api/organizers/${organizerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firebaseUserId: null,
          linkedUserLogin: null,
          appId: user.appId || activeAppId
        })
      });
      
      // Update user to remove organizer reference
      const userUpdateData = {
        firebaseUserId: user.firebaseUserId,
        appId: user.appId || activeAppId,
        regionalOrganizerInfo: {
          ...user.regionalOrganizerInfo,
          organizerId: null,
          isApproved: false,
          isEnabled: false,
          isActive: false
        }
      };
      
      await usersApi.updateUser(userUpdateData);
      
      // Remove organizer role
      const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
      if (organizerRole) {
        const roleIds = [...(user.roleIds || [])];
        const roleObjectIds = roleIds.map(role => 
          typeof role === 'object' ? role._id : role
        ).filter(id => id !== organizerRole._id);
        
        await usersApi.updateUserRoles(user.firebaseUserId, roleObjectIds, user.appId || activeAppId);
      }
      
      // Refresh users if callback provided
      if (typeof refreshUsers === 'function') {
        await refreshUsers(true);
      }
      
      // Call success callback if provided
      if (typeof onSuccess === 'function') {
        onSuccess('disconnectOrganizer', { ...user, isOrganizer: 'No', hasOrganizerId: false });
      }
      
      return user;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  }, [activeAppId, roles, refreshUsers, onSuccess]);
  
  return {
    // State
    loading,
    error,
    selectedUser,
    
    // Actions
    createOrganizer,
    deleteOrganizer,
    connectUserToOrganizer,
    disconnectUserFromOrganizer
  };
};

export default useOrganizerActions;