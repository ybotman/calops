/**
 * Organizers API Client
 * Handles all organizer-related API calls
 */

import axios from 'axios';

const organizersApi = {
  /**
   * Get all organizers for an application
   * @param {string} appId - Application ID
   * @param {boolean} isActive - Filter by active status (optional)
   * @returns {Promise<Array>} Array of organizers
   */
  async getOrganizers(appId, isActive = undefined, includeAllFields = false) {
    // Use environment variable for backend URL consistency
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    const params = {
      appId,
      _t: Date.now() // Cache-busting parameter
    };
    
    if (isActive !== undefined) {
      params.isActive = isActive;
    }
    
    // If we need all fields (like for editing), don't use select
    if (includeAllFields) {
      // Request all fields by specifying them explicitly
      const allFields = '_id appId fullName shortName description isActive isEnabled wantRender isRendered ' +
                       'publicContactInfo organizerTypes images delegatedOrganizerIds ' +
                       'organizerRegion masteredRegionId masteredDivisionId masteredCityId ' +
                       'firebaseUserId linkedUserLogin organizerBannerImage organizerProfileImage ' +
                       'organizerLandscapeImage organizerLogoImage btcNiceName updatedAt';
      params.select = allFields;
    }
    
    console.log('Fetching organizers with params:', params);
    
    try {
      const response = await axios.get(`${backendUrl}/api/organizers`, {
        params,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const data = response.data;
      
      // Handle both response formats:
      // 1. Direct array (legacy)
      // 2. Object with organizers array and pagination (new format)
      if (Array.isArray(data)) {
        return data;
      } else if (data.organizers && Array.isArray(data.organizers)) {
        return data.organizers;
      } else {
        console.error('Unexpected response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching organizers:', error);
      throw error;
    }
  },

  /**
   * Get a single organizer by ID
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Organizer data
   */
  async getOrganizer(organizerId, appId) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    try {
      const response = await axios.get(`${backendUrl}/api/organizers/${organizerId}`, {
        params: { appId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching organizer:', error);
      throw error;
    }
  },

  /**
   * Create a new organizer
   * @param {Object} organizerData - Organizer data
   * @returns {Promise<Object>} Created organizer
   */
  async createOrganizer(organizerData) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    console.log('Creating organizer with data:', organizerData);
    console.log('Backend URL:', backendUrl);
    
    try {
      const response = await axios.post(`${backendUrl}/api/organizers`, organizerData);
      
      console.log('Organizer created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating organizer:', error);
      
      // Axios errors already have the response property structured correctly
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
      
      // Re-throw the error with axios structure intact
      throw error;
    }
  },

  /**
   * Update an organizer
   * @param {string} organizerId - Organizer ID
   * @param {Object} organizerData - Updated organizer data
   * @returns {Promise<Object>} Updated organizer
   */
  async updateOrganizer(organizerId, organizerData) {
    const appId = organizerData.appId || '1';
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    console.log('Updating organizer with PUT request:');
    console.log('Organizer ID:', organizerId);
    console.log('Data:', JSON.stringify(organizerData, null, 2));
    
    try {
      const response = await axios.put(
        `${backendUrl}/api/organizers/${organizerId}`,
        organizerData,
        {
          params: { appId }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Update failed:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      throw error;
    }
  },

  /**
   * Delete an organizer
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOrganizer(organizerId, appId) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    try {
      const response = await axios.delete(`${backendUrl}/api/organizers/${organizerId}`, {
        params: { appId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting organizer:', error);
      throw error;
    }
  },

  /**
   * Connect an organizer to a user
   * @param {string} organizerId - Organizer ID
   * @param {string} firebaseUserId - Firebase user ID to connect
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Connection result
   */
  async connectToUser(organizerId, firebaseUserId, appId) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    try {
      const response = await axios.patch(
        `${backendUrl}/api/organizers/${organizerId}/connect-user`,
        { firebaseUserId, appId }
      );
      return response.data;
    } catch (error) {
      console.error('Error connecting user:', error);
      throw error;
    }
  },

  /**
   * Disconnect an organizer from a user
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Disconnection result
   */
  async disconnectFromUser(organizerId, appId) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    try {
      const response = await axios.patch(
        `${backendUrl}/api/organizers/${organizerId}/disconnect-user`,
        { appId }
      );
      return response.data;
    } catch (error) {
      console.error('Error disconnecting user:', error);
      throw error;
    }
  },
};

export default organizersApi;