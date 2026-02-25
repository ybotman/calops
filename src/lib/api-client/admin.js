/**
 * Admin API client module
 * Provides access to admin-only endpoints for CALOPS dashboard
 *
 * Uses relative URLs to go through Next.js proxy routes which add
 * Azure Function key authentication (see /api/ops/[...path]/route.js)
 */

import axios from 'axios';

/**
 * Admin API client for admin-specific endpoints
 */
const adminApi = {
  /**
   * Get user activity data (last logins, stale users, etc.)
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID (default: "1")
   * @param {number} options.staleDays - Days threshold for stale users (default: 30)
   * @param {number} options.limit - Max users to return (default: 100)
   * @param {string} options.sort - Sort by "lastLogin" or "created" (default: "lastLogin")
   * @returns {Promise<Object>} User activity data
   */
  getUserActivity: async (options = {}) => {
    const {
      appId = '1',
      staleDays = 30,
      limit = 100,
      sort = 'lastLogin'
    } = options;

    try {
      const params = new URLSearchParams({
        appId,
        staleDays: staleDays.toString(),
        limit: limit.toString(),
        sort
      });

      const response = await axios.get(
        `/api/ops/user-activity?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  },

  /**
   * Get data health/quality issues
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID (default: "1")
   * @param {boolean} options.refresh - Force cache refresh (default: false)
   * @returns {Promise<Object>} Data health issues
   */
  getDataHealth: async (options = {}) => {
    const { appId = '1', refresh = false } = options;

    try {
      const params = new URLSearchParams({ appId });
      if (refresh) {
        params.append('refresh', 'true');
      }

      const response = await axios.get(
        `/api/ops/data-health?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching data health:', error);
      throw error;
    }
  }
};

export default adminApi;
