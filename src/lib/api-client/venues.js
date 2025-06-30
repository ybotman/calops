/**
 * Venues API client module
 * Provides standardized access to venue-related API endpoints
 */

import axios from 'axios';
import { processResponse, handleApiError, buildQueryString } from './utils';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

/**
 * Venues API client for interacting with venue endpoints
 */
const venuesApi = {
  /**
   * Get all venues with optional filtering
   * @param {Object} options - Request options
   * @param {string} options.appId - Application ID
   * @param {boolean} options.active - Filter by active status
   * @param {string} options.search - Search term for venue name
   * @param {Object} options.filter - Additional filter criteria
   * @param {number} options.page - Page number for pagination
   * @param {number} options.pageSize - Items per page
   * @param {number} options.timestamp - Cache busting timestamp
   * @returns {Promise<Array>} Array of venues
   */
  getVenues: async (options = {}) => {
    try {
      // Build query parameters
      const queryParams = {
        appId: options.appId || '1',
        ...(options.active !== undefined && { active: options.active }),
        ...(options.search && { search: options.search }),
        ...(options.page !== undefined && { page: options.page }),
        ...(options.pageSize !== undefined && { pageSize: options.pageSize }),
        ...(options.timestamp && { _: options.timestamp })
      };
      
      // Add filter parameters if provided
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams[key] = value;
          }
        });
      }
      
      // Build URL with query parameters
      const url = `${API_BASE_URL}/api/venues${buildQueryString(queryParams)}`;
      
      // Make API request
      const response = await axios.get(url);
      
      // Process response with enhanced handling for different response formats
      let venues = [];
      
      // Handle array directly in response.data
      if (Array.isArray(response.data)) {
        venues = response.data;
      } 
      // Handle venues property in response.data
      else if (response.data && response.data.venues && Array.isArray(response.data.venues)) {
        venues = response.data.venues;
      }
      // Handle data property in response.data (common pattern)
      else if (response.data && response.data.data) {
        // If data is an array, use it directly
        if (Array.isArray(response.data.data)) {
          venues = response.data.data;
        } 
        // If data is an object with venue objects as values, convert to array
        else if (typeof response.data.data === 'object' && response.data.data !== null) {
          // If appears to be a collection of venues
          if (Object.values(response.data.data).some(v => v && typeof v === 'object')) {
            venues = Object.values(response.data.data);
          }
          // If appears to be a single venue object
          else if (response.data.data._id || response.data.data.id) {
            venues = [response.data.data];
          }
        }
      }
      // Handle pagination object with results
      else if (response.data && response.data.results && Array.isArray(response.data.results)) {
        venues = response.data.results;
      }
      
      // Return processed venues, including an empty array as a valid response
      return venues;
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: [],
        context: 'venuesApi.getVenues'
      });
    }
  },
  
  /**
   * Get a venue by ID
   * @param {string} venueId - Venue ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Venue object
   */
  getVenueById: async (venueId, appId = '1') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/venues/${venueId}?appId=${appId}`);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.getVenueById'
      });
    }
  },
  
  /**
   * Create a new venue
   * @param {Object} venueData - Venue data
   * @returns {Promise<Object>} Created venue
   */
  createVenue: async (venueData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/venues`, venueData);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.createVenue'
      });
    }
  },
  
  /**
   * Update a venue
   * @param {string} venueId - Venue ID
   * @param {Object} venueData - Venue data
   * @returns {Promise<Object>} Updated venue
   */
  updateVenue: async (venueId, venueData) => {
    try {
      // Extract appId and ensure it's included in the request
      const { appId = '1', ...data } = venueData;
      
      // Include appId in the data payload as well
      const payload = {
        ...data,
        appId
      };
      
      const response = await axios.put(`${API_BASE_URL}/api/venues/${venueId}?appId=${appId}`, payload);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.updateVenue'
      });
    }
  },
  
  /**
   * Delete a venue
   * @param {string} venueId - Venue ID
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteVenue: async (venueId, appId = '1') => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/venues/${venueId}?appId=${appId}`);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.deleteVenue'
      });
    }
  },
  
  /**
   * Get nearest city to coordinates
   * @param {Array|Object} coordinates - [longitude, latitude] or {lng, lat}
   * @param {string} appId - Application ID
   * @returns {Promise<Object>} Nearest city information
   */
  getNearestCity: async (coordinates, appId = '1') => {
    try {
      // Normalize coordinates format
      let lng, lat;
      
      if (Array.isArray(coordinates)) {
        [lng, lat] = coordinates;
      } else if (coordinates && typeof coordinates === 'object') {
        lng = coordinates.lng || coordinates.longitude;
        lat = coordinates.lat || coordinates.latitude;
      } else {
        throw new Error('Invalid coordinates format');
      }
      
      if (!lng || !lat) {
        throw new Error('Missing longitude or latitude');
      }
      
      const response = await axios.get(
        `${API_BASE_URL}/api/venues/nearest-city?longitude=${lng}&latitude=${lat}&appId=${appId}&limit=5`
      );
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.getNearestCity'
      });
    }
  },
  
  /**
   * Validate venue geolocation
   * @param {string} venueId - Venue ID
   * @param {Object} options - Validation options
   * @param {Array|Object} options.coordinates - [longitude, latitude] or {lng, lat}
   * @param {string} options.masteredCityId - Mastered city ID
   * @param {boolean} options.fallbackToDefault - Whether to use default coordinates if missing
   * @param {string} options.appId - Application ID
   * @returns {Promise<Object>} Validation result
   */
  validateGeolocation: async (venueId, options = {}) => {
    try {
      const appId = options.appId || '1';
      
      // Build request body
      const requestBody = {
        venueId,
        appId,
        ...options
      };
      
      // Make API request
      const response = await axios.post(`${API_BASE_URL}/api/venues/validate-geo`, requestBody);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.validateGeolocation'
      });
    }
  },
  
  /**
   * Batch validate venue geolocations
   * @param {Array<string>} venueIds - Array of venue IDs
   * @param {Object} options - Validation options
   * @param {boolean} options.fallbackToDefault - Whether to use default coordinates if missing
   * @param {string} options.appId - Application ID
   * @returns {Promise<Object>} Validation results
   */
  batchValidateGeolocation: async (venueIds, options = {}) => {
    try {
      const appId = options.appId || '1';
      
      // Build request body
      const requestBody = {
        venueIds,
        appId,
        ...options
      };
      
      // Make API request
      const response = await axios.post(`${API_BASE_URL}/api/venues/batch-validate-geo`, requestBody);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.batchValidateGeolocation'
      });
    }
  }
};

export default venuesApi;