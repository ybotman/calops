/**
 * API client for the calendar-admin application
 * Provides a centralized way to make API requests to the backend
 */

import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// Create a configured axios instance
const apiClient = axios.create({
  baseURL: BE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Users API
export const usersApi = {
  getUsers: async (appId = '1', active, timestamp) => {
    let url = `/api/userlogins/all?appId=${appId}`;
    if (active !== undefined) {
      url += `&active=${active}`;
    }
    // Add timestamp for cache busting if needed
    if (timestamp) {
      url += `&_=${timestamp}`;
    }
    console.log('Getting users with URL:', url);
    const response = await apiClient.get(url);
    return response.data;
  },
  
  getUserById: async (firebaseUserId, appId = '1') => {
    const response = await apiClient.get(`/api/userlogins/firebase/${firebaseUserId}?appId=${appId}`);
    return response.data;
  },
  
  updateUser: async (userData) => {
    const { firebaseUserId, appId = '1', ...data } = userData;
    console.log('Sending update to backend:', {
      firebaseUserId,
      appId,
      ...data
    });
    const response = await apiClient.put('/api/userlogins/updateUserInfo', {
      firebaseUserId,
      appId,
      ...data
    });
    return response.data;
  },
  
  updateUserRoles: async (firebaseUserId, roleIds, appId = '1') => {
    const response = await apiClient.put(`/api/userlogins/${firebaseUserId}/roles`, {
      roleIds,
      appId
    });
    return response.data;
  },
  
  createUser: async (userData) => {
    const response = await apiClient.post('/api/userlogins', userData);
    return response.data;
  },
  
  deleteUser: async (userId, appId = '1') => {
    try {
      console.log(`Deleting user ${userId} with appId ${appId}...`);
      
      // First attempt the direct database access via our debug endpoint
      const directResponse = await apiClient.delete(`/api/debug?userId=${userId}&appId=${appId}`);
      return directResponse.data;
    } catch (directError) {
      console.error('Direct database deletion failed:', directError.message);
      
      // Try the backend API route
      try {
        const response = await apiClient.delete(`/api/userlogins/${userId}?appId=${appId}`);
        return response.data;
      } catch (firstError) {
        console.error('First API deletion attempt failed:', firstError.message);
        
        // Try alternative endpoint
        try {
          const alternativeResponse = await apiClient.delete(`/api/users/${userId}?appId=${appId}`);
          return alternativeResponse.data;
        } catch (secondError) {
          console.error('All deletion attempts failed');
          throw new Error(`Failed to delete user: ${directError.message}`);
        }
      }
    }
  },
  
  deleteAllTempUsers: async (appId = '1') => {
    try {
      console.log(`Attempting to delete all temporary users for appId ${appId}...`);
      
      // Use the direct MongoDB access through our debug endpoint
      const response = await apiClient.post('/api/debug', {
        action: 'deleteAllTempUsers',
        appId
      });
      
      console.log('Delete all temp users response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to delete all temporary users:', error);
      throw error;
    }
  }
};

// Roles API
export const rolesApi = {
  getRoles: async (appId = '1') => {
    const response = await apiClient.get(`/api/roles?appId=${appId}`);
    return response.data;
  }
};

// Organizers API
export const organizersApi = {
  getOrganizers: async (appId = '1', active, approved) => {
    try {
      // Build simple query with required filter params
      let queryParams = new URLSearchParams({
        appId: appId
      });
      
      // Add a filter to satisfy the backend requirement
      queryParams.append('isActive', active !== undefined ? active : 'true');
      
      if (approved !== undefined) {
        queryParams.append('isApproved', approved);
      }
      
      // Use the regular endpoint with the required filters
      const response = await apiClient.get(`/api/organizers?${queryParams.toString()}`);
      console.log('Fetched organizers successfully:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error in getOrganizers:', error);
      // Return empty array to prevent UI errors
      return [];
    }
  },
  
  getOrganizerById: async (id, appId = '1') => {
    const response = await apiClient.get(`/api/organizers/${id}?appId=${appId}`);
    return response.data;
  },
  
  createOrganizer: async (organizerData) => {
    const response = await apiClient.post('/api/organizers', organizerData);
    return response.data;
  },
  
  updateOrganizer: async (id, organizerData) => {
    // Include appId as a query parameter
    const appId = organizerData.appId || '1';
    const response = await apiClient.patch(`/api/organizers/${id}?appId=${appId}`, organizerData);
    return response.data;
  },
  
  connectToUser: async (id, firebaseUserId, appId = '1') => {
    console.log(`Connecting organizer ${id} to user ${firebaseUserId} with appId ${appId}`);
    
    // Try approach #1: Direct database connection using our custom API
    try {
      console.log('Attempting connection via direct database operation...');
      
      const directResponse = await fetch(`/api/organizers/${id}/connect-user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUserId,
          appId
        }),
      });
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log('Connection successful via direct database operation');
        return data;
      } else {
        console.warn('Direct database connection failed:', await directResponse.text());
        // Continue to next approach
      }
    } catch (directError) {
      console.error('Error with direct database connection:', directError);
      // Continue to next approach
    }
    
    // Try approach #2: Simple update approach with organizer PATCH
    try {
      console.log('Attempting simple PATCH update of organizer...');
      
      // First, fetch the organizer
      const organizerResponse = await apiClient.get(`/api/organizers/${id}?appId=${appId}`);
      const organizer = organizerResponse.data;
      
      // Update the organizer with the user connection
      const updateData = {
        firebaseUserId: firebaseUserId,
        appId: appId
      };
      
      // Make a simple update request
      const updateResponse = await apiClient.patch(`/api/organizers/${id}`, updateData);
      
      console.log('Successfully updated organizer via simple PATCH');
      
      // Now, try to update the user separately
      try {
        // Fetch the user
        const userResponse = await apiClient.get(`/api/users?firebaseUserId=${firebaseUserId}&appId=${appId}`);
        if (userResponse.data && userResponse.data.length > 0) {
          const user = userResponse.data[0];
          
          // Update the user to include the organizer reference
          await apiClient.patch(`/api/users/${user._id}`, {
            regionalOrganizerInfo: {
              organizerId: id,
              isApproved: true,
              isEnabled: true,
              isActive: true
            }
          });
          
          console.log('Successfully updated user with organizer reference');
        }
      } catch (userError) {
        console.warn('Could not update user, but organizer was updated:', userError.message);
      }
      
      return {
        success: true,
        message: 'Connected user to organizer via simple update',
        organizer: updateResponse.data
      };
    } catch (updateError) {
      console.error('Error with simple update approach:', updateError);
      // Continue to fallback approach
    }
    
    // Last resort: Try a complete two-step update with all details
    try {
      console.log('Attempting complete two-step update...');
      
      // First update the organizer
      const orgUpdateResponse = await fetch(`/api/organizers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUserId,
          appId
        }),
      });
      
      if (!orgUpdateResponse.ok) {
        throw new Error(`Failed to update organizer: ${await orgUpdateResponse.text()}`);
      }
      
      const updatedOrganizer = await orgUpdateResponse.json();
      console.log('Successfully updated organizer in step 1');
      
      // Now update the user via our direct API (not the backend)
      try {
        // This endpoint should exist in our app
        const userUpdateResponse = await fetch(`/api/debug/connect-user-to-organizer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUserId,
            organizerId: id,
            appId
          }),
        });
        
        if (userUpdateResponse.ok) {
          console.log('Successfully updated user in step 2');
        } else {
          console.warn('User update failed, but organizer was updated');
        }
      } catch (userUpdateError) {
        console.warn('Error updating user, but organizer was updated:', userUpdateError);
      }
      
      return {
        success: true,
        message: 'Connected user to organizer via two-step update',
        organizer: updatedOrganizer
      };
    } catch (fallbackError) {
      console.error('All connection approaches failed:', fallbackError);
      throw new Error(`Failed to connect user to organizer: ${fallbackError.message}`);
    }
  }
};

// Debug API
export const debugApi = {
  checkBackend: async () => {
    try {
      const response = await apiClient.get('/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default {
  users: usersApi,
  roles: rolesApi,
  organizers: organizersApi,
  debug: debugApi
};