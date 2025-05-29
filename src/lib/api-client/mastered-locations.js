/**
 * Mastered Locations API client module
 * Provides standardized access to geo-hierarchy endpoints
 */

import axios from 'axios';
import { processResponse, handleApiError, buildQueryString } from './utils';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_NEXT_API_URL || '';

/**
 * Mastered Locations API client for geo-hierarchy data
 */
const masteredLocationsApi = {
  /**
   * Get all countries
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID
   * @param {boolean} options.isActive - Filter by active status
   * @param {number} options.page - Page number for pagination
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Countries with pagination info
   */
  getCountries: async (options = {}) => {
    const queryParams = {
      appId: options.appId || '1',
      ...(options.isActive !== undefined && { isActive: options.isActive }),
      ...(options.page && { page: options.page }),
      ...(options.limit && { limit: options.limit })
    };
    
    try {
      const url = `${API_BASE_URL}/api/geo-hierarchy/countries${buildQueryString(queryParams)}`;
      const response = await axios.get(url);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: { countries: [], pagination: { total: 0, page: 1, limit: 100, pages: 0 } },
        context: 'masteredLocationsApi.getCountries'
      });
    }
  },

  /**
   * Get regions by country
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID
   * @param {string} options.countryId - Country ID to filter by
   * @param {boolean} options.isActive - Filter by active status
   * @param {boolean} options.populate - Whether to populate references
   * @returns {Promise<Object>} Regions with pagination info
   */
  getRegions: async (options = {}) => {
    const queryParams = {
      appId: options.appId || '1',
      ...(options.countryId && { countryId: options.countryId }),
      ...(options.isActive !== undefined && { isActive: options.isActive }),
      ...(options.populate !== undefined && { populate: options.populate }),
      ...(options.page && { page: options.page }),
      ...(options.limit && { limit: options.limit })
    };
    
    try {
      const url = `${API_BASE_URL}/api/geo-hierarchy/regions${buildQueryString(queryParams)}`;
      const response = await axios.get(url);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: { regions: [], pagination: { total: 0, page: 1, limit: 100, pages: 0 } },
        context: 'masteredLocationsApi.getRegions'
      });
    }
  },

  /**
   * Get divisions by region
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID
   * @param {string} options.regionId - Region ID to filter by
   * @param {boolean} options.isActive - Filter by active status
   * @param {boolean} options.populate - Whether to populate references
   * @returns {Promise<Object>} Divisions with pagination info
   */
  getDivisions: async (options = {}) => {
    const queryParams = {
      appId: options.appId || '1',
      ...(options.regionId && { regionId: options.regionId }),
      ...(options.isActive !== undefined && { isActive: options.isActive }),
      ...(options.populate !== undefined && { populate: options.populate }),
      ...(options.page && { page: options.page }),
      ...(options.limit && { limit: options.limit })
    };
    
    try {
      const url = `${API_BASE_URL}/api/geo-hierarchy/divisions${buildQueryString(queryParams)}`;
      const response = await axios.get(url);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: { divisions: [], pagination: { total: 0, page: 1, limit: 100, pages: 0 } },
        context: 'masteredLocationsApi.getDivisions'
      });
    }
  },

  /**
   * Get cities by division
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID
   * @param {string} options.divisionId - Division ID to filter by
   * @param {boolean} options.isActive - Filter by active status
   * @param {boolean} options.populate - Whether to populate references
   * @returns {Promise<Object>} Cities with pagination info
   */
  getCities: async (options = {}) => {
    const queryParams = {
      appId: options.appId || '1',
      ...(options.divisionId && { divisionId: options.divisionId }),
      ...(options.isActive !== undefined && { isActive: options.isActive }),
      ...(options.populate !== undefined && { populate: options.populate }),
      ...(options.page && { page: options.page }),
      ...(options.limit && { limit: options.limit })
    };
    
    try {
      const url = `${API_BASE_URL}/api/geo-hierarchy/cities${buildQueryString(queryParams)}`;
      const response = await axios.get(url);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: { cities: [], pagination: { total: 0, page: 1, limit: 100, pages: 0 } },
        context: 'masteredLocationsApi.getCities'
      });
    }
  },

  /**
   * Get all geo-hierarchy data in one request
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID
   * @param {boolean} options.isActive - Filter by active status
   * @param {boolean} options.populate - Whether to populate references
   * @param {number} options.limit - Maximum items per type
   * @returns {Promise<Object>} All geo-hierarchy data
   */
  getAllGeoData: async (options = {}) => {
    const queryParams = {
      appId: options.appId || '1',
      ...(options.isActive !== undefined && { isActive: options.isActive }),
      ...(options.populate !== undefined && { populate: options.populate }),
      ...(options.limit && { limit: options.limit })
    };
    
    try {
      const url = `${API_BASE_URL}/api/geo-hierarchy/all${buildQueryString(queryParams)}`;
      const response = await axios.get(url);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: { countries: [], regions: [], divisions: [], cities: [] },
        context: 'masteredLocationsApi.getAllGeoData'
      });
    }
  }
};

export default masteredLocationsApi;