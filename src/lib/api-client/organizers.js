/**
 * Organizers API Client
 * Handles all organizer-related API calls
 */

import { apiRequest } from './utils';

const organizersApi = {
  /**
   * Get all organizers for an application
   * @param {string} appId - Application ID
   * @param {boolean} isActive - Filter by active status (optional)
   * @returns {Promise<Array>} Array of organizers
   */
  async getOrganizers(appId, isActive = undefined) {
    const params = new URLSearchParams({ appId });
    if (isActive !== undefined) {
      params.append('isActive', isActive);
    }
    
    const response = await apiRequest(`/api/organizers?${params}`);
    return response;
  },

  /**
   * Get a single organizer by ID
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Organizer data
   */
  async getOrganizer(organizerId, appId) {
    const params = new URLSearchParams({ appId });
    return apiRequest(`/api/organizers/${organizerId}?${params}`);
  },

  /**
   * Create a new organizer
   * @param {Object} organizerData - Organizer data
   * @returns {Promise<Object>} Created organizer
   */
  async createOrganizer(organizerData) {
    const response = await apiRequest('/api/organizers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizerData),
    });
    return response;
  },

  /**
   * Update an organizer
   * @param {string} organizerId - Organizer ID
   * @param {Object} organizerData - Updated organizer data
   * @returns {Promise<Object>} Updated organizer
   */
  async updateOrganizer(organizerId, organizerData) {
    const appId = organizerData.appId || '1';
    const params = new URLSearchParams({ appId });
    
    const response = await apiRequest(`/api/organizers/${organizerId}?${params}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizerData),
    });
    return response;
  },

  /**
   * Delete an organizer
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOrganizer(organizerId, appId) {
    const params = new URLSearchParams({ appId });
    return apiRequest(`/api/organizers/${organizerId}?${params}`, {
      method: 'DELETE',
    });
  },

  /**
   * Connect an organizer to a user
   * @param {string} organizerId - Organizer ID
   * @param {string} firebaseUserId - Firebase user ID to connect
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Connection result
   */
  async connectToUser(organizerId, firebaseUserId, appId) {
    const response = await apiRequest(`/api/organizers/${organizerId}/connect-user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebaseUserId, appId }),
    });
    return response;
  },

  /**
   * Disconnect an organizer from a user
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Disconnection result
   */
  async disconnectFromUser(organizerId, appId) {
    const response = await apiRequest(`/api/organizers/${organizerId}/disconnect-user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appId }),
    });
    return response;
  },
};

export default organizersApi;