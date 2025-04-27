/**
 * Roles API client module
 * Provides standardized access to role-related API endpoints
 */

import axios from 'axios';
import { processResponse, handleApiError, buildQueryString } from './utils';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_NEXT_API_URL || '';

/**
 * Roles API client for interacting with role endpoints
 */
const rolesApi = {
  /**
   * Get all roles
   * @param {string|Object} options - Application ID string or options object
   * @param {string} options.appId - Application ID
   * @returns {Promise<Array>} Array of roles
   */
  getRoles: async (options = {}) => {
    // Handle legacy format (string appId parameter)
    const params = typeof options === 'string'
      ? { appId: options }
      : options;
    
    // Set default appId if not provided
    const queryParams = {
      appId: params.appId || '1'
    };
    
    try {
      // Build URL with query parameters
      const url = `${API_BASE_URL}/api/roles${buildQueryString(queryParams)}`;
      
      // Make API request
      const response = await axios.get(url);
      
      // Process response using shared utility
      return processResponse(response, 'roles', true) || [];
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: [],
        context: 'rolesApi.getRoles'
      });
    }
  },
  
  /**
   * Get a role by ID
   * @param {string} roleId - Role ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Role object
   */
  getRoleById: async (roleId, appId = '1') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/roles/${roleId}?appId=${appId}`);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'rolesApi.getRoleById'
      });
    }
  },
  
  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>} Created role
   */
  createRole: async (roleData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/roles`, roleData);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'rolesApi.createRole'
      });
    }
  },
  
  /**
   * Update a role
   * @param {string} roleId - Role ID
   * @param {Object} roleData - Role data
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Updated role
   */
  updateRole: async (roleId, roleData, appId = '1') => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/roles/${roleId}?appId=${appId}`, roleData);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'rolesApi.updateRole'
      });
    }
  },
  
  /**
   * Delete a role
   * @param {string} roleId - Role ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteRole: async (roleId, appId = '1') => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/roles/${roleId}?appId=${appId}`);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'rolesApi.deleteRole'
      });
    }
  }
};

export default rolesApi;