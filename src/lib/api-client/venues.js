/**
 * Venues API client module
 * Provides standardized access to venue-related API endpoints
 */

import axios from 'axios';
import { processResponse, handleApiError, buildQueryString } from './utils';

// Base configuration
// In development, use relative URLs to go through Next.js proxy
// In production, use the backend URL from environment
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment ? '' : (process.env.NEXT_PUBLIC_BE_URL || '');

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
   * @param {boolean} options.getAllPages - Fetch all pages automatically (default: true)
   * @returns {Promise<Array>} Array of venues
   */
  getVenues: async (options = {}) => {
    try {
      // Check if we should fetch all pages (default true for backward compatibility)
      const fetchAllPages = options.getAllPages !== false;
      
      // If specific page requested or getAllPages is false, use original behavior
      if (!fetchAllPages || options.page !== undefined) {
        return venuesApi._getVenuesPage(options);
      }
      
      // Fetch all pages automatically
      let allVenues = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxLimit = 500; // Backend max limit
      
      while (hasMorePages) {
        // Build query parameters for this page
        const pageOptions = {
          ...options,
          page: currentPage,
          pageSize: maxLimit // Use max limit for efficiency
        };
        
        // Fetch this page
        const response = await venuesApi._getVenuesPageRaw(pageOptions);
        
        // Extract venues from this page
        let pageVenues = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          pageVenues = response.data.data;
        }
        
        // Add to all venues
        allVenues = allVenues.concat(pageVenues);
        
        // Check if there are more pages
        if (response.data && response.data.pagination) {
          const { page, pages, total } = response.data.pagination;
          hasMorePages = page < pages;
          currentPage++;
          
        } else {
          // No pagination info, assume single page
          hasMorePages = false;
        }
      }
      
      return allVenues;
    } catch (error) {
      return handleApiError(error, {
        returnDefault: true,
        defaultValue: [],
        context: 'venuesApi.getVenues'
      });
    }
  },
  
  /**
   * Internal method to get raw page response
   * @private
   */
  _getVenuesPageRaw: async (options = {}) => {
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
    const url = `/api/venues${buildQueryString(queryParams)}`;
    
    // Make API request
    return await axios.get(url);
  },
  
  /**
   * Internal method to get single page of venues (original behavior)
   * @private
   */
  _getVenuesPage: async (options = {}) => {
    try {
      const response = await venuesApi._getVenuesPageRaw(options);
      
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
        context: 'venuesApi._getVenuesPage'
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
      const response = await axios.get(`/api/venues/${venueId}?appId=${appId}`);
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
      const response = await axios.post(`/api/venues`, venueData);
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
      
      const url = `/api/venues/${venueId}?appId=${appId}`;
      
      const response = await axios.put(url, payload);
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
      const response = await axios.delete(`/api/venues/${venueId}?appId=${appId}`);
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
        `/api/venues/nearest-city?longitude=${lng}&latitude=${lat}&appId=${appId}&limit=5`
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
      const response = await axios.post(`/api/venues/validate-geo`, requestBody);
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
      const response = await axios.post(`/api/venues/batch-validate-geo`, requestBody);
      return processResponse(response);
    } catch (error) {
      return handleApiError(error, {
        context: 'venuesApi.batchValidateGeolocation'
      });
    }
  }
};

export default venuesApi;