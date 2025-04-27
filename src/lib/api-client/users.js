/**
 * Users API client module
 * Provides standardized access to user-related API endpoints
 */

import axios from 'axios';
import { processResponse, handleApiError, buildQueryString } from './utils';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_NEXT_API_URL || '';

/**
 * Users API client for interacting with user endpoints
 */
const usersApi = {
  /**
   * Get all users
   * @param {Object|string} options - Request options or appId string
   * @param {string} options.appId - Application ID
   * @param {boolean} options.active - Filter by active status
   * @param {number} options.timestamp - Cache busting timestamp
   * @returns {Promise<Array>} Array of users
   */
  getUsers: async (options = {}) => {
    // Handle legacy format (string appId parameter)
    const params = typeof options === 'string' 
      ? { appId: options }
      : options;
    
    // Set default appId if not provided
    const queryParams = {
      appId: params.appId || '1',
      ...(params.active !== undefined && { active: params.active }),
      ...(params.timestamp && { _: params.timestamp })
    };
    
    try {
      // Build URL with query parameters
      const url = `${API_BASE_URL}/api/users${buildQueryString(queryParams)}`;
      
      // Make API request
      const response = await axios.get(url);
      
      // Process response using shared utility
      return processResponse(response, 'users', true) || [];
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: [],
        context: 'usersApi.getUsers'
      });
    }
  },
  
  /**
   * Get a user by ID
   * @param {string} firebaseUserId - Firebase user ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} User object
   */
  getUserById: async (firebaseUserId, appId = '1') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/${firebaseUserId}?appId=${appId}`);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'usersApi.getUserById'
      });
    }
  },
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  createUser: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users`, userData);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'usersApi.createUser'
      });
    }
  },
  
  /**
   * Update a user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Updated user
   */
  updateUser: async (userData) => {
    try {
      const { firebaseUserId, appId = '1', ...data } = userData;
      
      const response = await axios.put(`${API_BASE_URL}/api/users/${firebaseUserId}?appId=${appId}`, data);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'usersApi.updateUser'
      });
    }
  },
  
  /**
   * Update user roles
   * @param {string} firebaseUserId - Firebase user ID
   * @param {Array<string>} roleIds - Array of role IDs
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Updated user
   */
  updateUserRoles: async (firebaseUserId, roleIds, appId = '1') => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/users/${firebaseUserId}/roles?appId=${appId}`, {
        roleIds,
        appId
      });
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'usersApi.updateUserRoles'
      });
    }
  },
  
  /**
   * Delete a user
   * @param {string} userId - User ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteUser: async (userId, appId = '1') => {
    try {
      // Try the main endpoint first
      const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}?appId=${appId}`);
      return processResponse(response);
    } catch (error) {
      console.error('First deletion attempt failed:', error.message);
      
      // Try the fallback endpoint if the first one fails
      try {
        const fallbackResponse = await axios.delete(`${API_BASE_URL}/api/users/${userId}/delete?appId=${appId}`);
        return processResponse(fallbackResponse);
      } catch (fallbackError) {
        return handleApiError(fallbackError, {
          context: 'usersApi.deleteUser'
        });
      }
    }
  },
  
  /**
   * Create an organizer for a user
   * @param {string} userId - User ID
   * @param {Object} organizerData - Organizer data
   * @returns {Promise<Object>} Created organizer
   */
  createUserOrganizer: async (userId, organizerData = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/${userId}/organizer`, organizerData);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'usersApi.createUserOrganizer'
      });
    }
  },
  
  /**
   * Delete a user's organizer
   * @param {string} userId - User ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteUserOrganizer: async (userId, appId = '1') => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}/organizer?appId=${appId}`);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'usersApi.deleteUserOrganizer'
      });
    }
  }
};

export default usersApi;