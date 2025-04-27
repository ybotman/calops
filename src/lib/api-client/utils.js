/**
 * API client utility functions
 * Common utility functions for use across all API client modules
 */

/**
 * Process API response to ensure consistent format
 * @param {Object} response - Raw API response
 * @param {string} dataField - Expected field containing data (optional)
 * @param {boolean} isArray - Whether the expected result should be an array
 * @returns {any} Normalized response data
 */
export const processResponse = (response, dataField = null, isArray = false) => {
  // Check for nested data structure
  if (dataField && response.data && response.data[dataField]) {
    return response.data[dataField];
  }
  
  // Handle direct array return
  if (isArray && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Default to returning the full response data
  return response.data;
};

/**
 * Standardized error handler for API requests
 * @param {Error} error - The caught error
 * @param {Object} options - Error handling options
 * @param {boolean} options.returnDefault - Whether to return a default value instead of throwing
 * @param {any} options.defaultValue - Default value to return
 * @param {string} options.context - Context for the error (for logging)
 * @returns {Promise<any>} Default value if returnDefault is true, otherwise throws
 */
export const handleApiError = async (error, options = {}) => {
  const { 
    returnDefault = false, 
    defaultValue = null, 
    context = 'API request' 
  } = options;

  // Log the error with context
  console.error(`Error in ${context}:`, error);

  // Extract helpful information from the error if available
  const errorInfo = {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data
  };

  // Log detailed error info
  if (error.response) {
    console.error('Error details:', JSON.stringify(errorInfo, null, 2));
  }

  // Either return default value or throw the error
  if (returnDefault) {
    return defaultValue;
  } else {
    // Create a more informative error
    const enhancedError = new Error(
      `${context} failed: ${error.message}${errorInfo.data?.message ? ` - ${errorInfo.data.message}` : ''}`
    );
    enhancedError.status = errorInfo.status;
    enhancedError.details = errorInfo.data;
    throw enhancedError;
  }
};

/**
 * Build query string from parameters
 * @param {Object} params - Object containing query parameters
 * @returns {string} Formatted query string (including the ? prefix)
 */
export const buildQueryString = (params = {}) => {
  const queryParams = new URLSearchParams();
  
  // Add all params that are defined
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Create a formatted error object from API error
 * @param {Error} error - The original error
 * @param {string} context - Error context description
 * @returns {Object} Formatted error object
 */
export const formatErrorForDisplay = (error, context = '') => {
  return {
    message: error.message,
    context: context,
    status: error.status || error.response?.status,
    details: error.details || error.response?.data
  };
};

/**
 * Format date for API calls
 * @param {Date|string} date - Date to format
 * @returns {string} Date formatted as YYYY-MM-DD
 */
export const formatDateForApi = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0];
  } catch (err) {
    console.warn('Error formatting date for API:', err);
    return '';
  }
};