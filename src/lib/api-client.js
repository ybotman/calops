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
    const response = await apiClient.patch(`/api/organizers/${id}/connect-user`, {
      firebaseUserId,
      appId
    });
    return response.data;
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