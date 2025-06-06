/**
 * Organizers API Client
 * Handles all organizer-related API calls
 */

const organizersApi = {
  /**
   * Get all organizers for an application
   * @param {string} appId - Application ID
   * @param {boolean} isActive - Filter by active status (optional)
   * @returns {Promise<Array>} Array of organizers
   */
  async getOrganizers(appId, isActive = undefined) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    const params = new URLSearchParams({ appId });
    if (isActive !== undefined) {
      params.append('isActive', isActive);
    }
    
    const response = await fetch(`${backendUrl}/api/organizers?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch organizers: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Get a single organizer by ID
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Organizer data
   */
  async getOrganizer(organizerId, appId) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    const params = new URLSearchParams({ appId });
    
    const response = await fetch(`${backendUrl}/api/organizers/${organizerId}?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch organizer: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Create a new organizer
   * @param {Object} organizerData - Organizer data
   * @returns {Promise<Object>} Created organizer
   */
  async createOrganizer(organizerData) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    const response = await fetch(`${backendUrl}/api/organizers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizerData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create organizer: ${response.status}`);
    }
    return response.json();
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
    
    const response = await fetch(`${backendUrl}/api/organizers/${organizerId}?appId=${appId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizerData),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update organizer: ${response.status}`);
    }
    
    return response.json();
  },

  /**
   * Delete an organizer
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteOrganizer(organizerId, appId) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    const params = new URLSearchParams({ appId });
    
    const response = await fetch(`${backendUrl}/api/organizers/${organizerId}?${params}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete organizer: ${response.status}`);
    }
    return response.json();
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
    
    const response = await fetch(`${backendUrl}/api/organizers/${organizerId}/connect-user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ firebaseUserId, appId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to connect user: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Disconnect an organizer from a user
   * @param {string} organizerId - Organizer ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Disconnection result
   */
  async disconnectFromUser(organizerId, appId) {
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    const response = await fetch(`${backendUrl}/api/organizers/${organizerId}/disconnect-user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appId }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to disconnect user: ${response.status}`);
    }
    return response.json();
  },
};

export default organizersApi;