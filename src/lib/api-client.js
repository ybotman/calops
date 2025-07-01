/**
 * API client for the calendar-admin application
 * Provides a centralized way to make API requests to the backend
 */

import axios from 'axios';

// Base URL for the API
// In development, use relative URLs to go through Next.js proxy
// In production, use the backend URL from environment
const isDevelopment = process.env.NODE_ENV === 'development';
const BE_URL = isDevelopment ? '' : (process.env.NEXT_PUBLIC_BE_URL || '');

// API client configuration

// Create a configured axios instance
const apiClient = axios.create({
  baseURL: BE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create internal axios instance for local API routes
const localApiClient = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for debugging
apiClient.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add interceptors for local API client  
localApiClient.interceptors.request.use(
  config => {
    console.log(`Local API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('Local API Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    // Check if response.data is what we expect (usually an array for list endpoints)
    if (response.config.url.includes('/all') || 
        response.config.url.includes('/organizers') || 
        response.config.url.includes('/users')) {
      if (!Array.isArray(response.data)) {
        // Only log debug info, not warnings, since we handle format differences in the API methods
        console.log('Response format:', 
          typeof response.data, 
          response.data ? `(${Object.keys(response.data).join(', ')})` : '');
      }
    }
    return response;
  },
  error => {
    console.error('API Response Error:', error.message);
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
    return Promise.reject(error);
  }
);

/**
 * Normalize appId to ensure it's always a string
 * @param {any} appId - The appId value that might be an object or string
 * @returns {string} - Normalized appId as a string
 */
function normalizeAppId(appId) {
  // If undefined or null, return default
  if (appId === undefined || appId === null) {
    return '1';
  }
  
  // If it's already a string, return it
  if (typeof appId === 'string') {
    return appId;
  }
  
  // If it's a number, convert to string
  if (typeof appId === 'number') {
    return appId.toString();
  }
  
  // If it's an object, try to extract id or _id
  if (typeof appId === 'object') {
    console.warn('Object passed as appId, normalizing', appId);
    
    // Check for common id properties
    if (appId.id) {
      return appId.id.toString();
    }
    
    if (appId._id) {
      return appId._id.toString();
    }
    
    // Last resort, try toString() or default
    try {
      const strValue = appId.toString();
      // Make sure toString didn't return "[object Object]"
      if (strValue !== '[object Object]') {
        return strValue;
      }
    } catch (e) {
      // Ignore toString errors
    }
  }
  
  // Default fallback
  return '1';
}

// Users API
export const usersApi = {
  // API request queue to track in-flight requests
  _requestQueue: new Map(),
  
  // Rate limiter to prevent too many requests
  _rateLimiter: {
    lastRequestTime: 0,
    minInterval: 300, // 300ms minimum time between requests
    isThrottled: false,
    retryTimeout: null,
    
    // Check if we should throttle a request
    shouldThrottle() {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (this.isThrottled) {
        return true;
      }
      
      if (timeSinceLastRequest < this.minInterval) {
        return true;
      }
      
      this.lastRequestTime = now;
      return false;
    },
    
    // Apply throttling for a brief period
    throttle(duration = 1000) {
      this.isThrottled = true;
      clearTimeout(this.retryTimeout);
      this.retryTimeout = setTimeout(() => {
        this.isThrottled = false;
      }, duration);
    }
  },
  
  getUsers: async (options = {}) => {
    // Ensure appId is a string
    let appId = '1';
    
    if (options && typeof options === 'object') {
      // Extract appId from options object
      appId = normalizeAppId(options.appId || '1');
    } else if (options && typeof options === 'string') {
      // For backward compatibility if just appId is passed
      appId = options;
    }
    
    // Get active and timestamp from options if provided
    const active = options && typeof options === 'object' ? options.active : undefined;
    const timestamp = options && typeof options === 'object' ? options.timestamp : undefined;
    
    // Create a request key for deduplication
    const requestKey = `users-${appId}-${active}-${timestamp || Date.now()}`;
    
    // Check if this exact request is in flight
    if (usersApi._requestQueue.has(requestKey)) {
      console.log('Request already in progress, returning existing promise');
      return usersApi._requestQueue.get(requestKey);
    }
    
    // Check for rate limiting
    if (usersApi._rateLimiter.shouldThrottle()) {
      console.log('Request throttled, delaying execution');
      await new Promise(resolve => setTimeout(resolve, usersApi._rateLimiter.minInterval));
    }
    
    try {
      // Use the backend API directly
      let url = `/api/userlogins/all?appId=${appId}`;
      if (active !== undefined) {
        url += `&active=${active}`;
      }
      // Add timestamp for cache busting if needed
      if (timestamp) {
        url += `&_=${timestamp}`;
      }
      
      console.log('Getting users with URL:', url);
      
      // Create request promise
      const requestPromise = new Promise(async (resolve, reject) => {
        try {
          const response = await apiClient.get(url);
          
          // Update the rate limiter
          usersApi._rateLimiter.lastRequestTime = Date.now();
          
          // The Next.js API route returns {users: Array, pagination: Object}
          if (response.data && response.data.users && Array.isArray(response.data.users)) {
            console.log(`Received ${response.data.users.length} users from API`);
            resolve(response.data.users);
          } else if (Array.isArray(response.data)) {
            // Handle case where API might return array directly
            console.log(`Received ${response.data.length} users directly as array`);
            resolve(response.data);
          } else {
            console.warn('usersApi.getUsers: API did not return users array', response.data);
            resolve([]);
          }
        } catch (error) {
          console.error('Error in usersApi.getUsers:', error);
          // Handle rate limiting errors
          if (error.response && error.response.status === 429) {
            console.warn('Rate limited by the server, will retry after delay');
            usersApi._rateLimiter.throttle(2000); // Throttle for 2 seconds
            resolve([]); // Return empty array for now
          } else if (error.response && error.response.status >= 500) {
            console.error('Server error, will retry after delay');
            usersApi._rateLimiter.throttle(3000); // Throttle for 3 seconds
            resolve([]); // Return empty array for now
          } else {
            // Return empty array to prevent UI errors
            resolve([]);
          }
        } finally {
          // Remove from request queue after completion
          setTimeout(() => {
            usersApi._requestQueue.delete(requestKey);
          }, 100);
        }
      });
      
      // Add to request queue
      usersApi._requestQueue.set(requestKey, requestPromise);
      
      return requestPromise;
    } catch (error) {
      console.error('Unexpected error in getUsers wrapper:', error);
      return [];
    }
  },
  
  getUserById: async (firebaseUserId, appId = '1') => {
    appId = normalizeAppId(appId);
    const response = await apiClient.get(`/api/userlogins/firebase/${firebaseUserId}?appId=${appId}`);
    return response.data;
  },
  
  updateUser: async (userData) => {
    const { firebaseUserId, appId = '1', ...data } = userData;
    const normalizedAppId = normalizeAppId(appId);
    
    console.log('Sending update to backend:', {
      firebaseUserId,
      appId: normalizedAppId,
      ...data
    });
    
    const response = await apiClient.put('/api/userlogins/updateUserInfo', {
      firebaseUserId,
      appId: normalizedAppId,
      ...data
    });
    return response.data;
  },
  
  updateUserRoles: async (firebaseUserId, roleIds, appId = '1') => {
    appId = normalizeAppId(appId);
    const response = await apiClient.put(`/api/userlogins/${firebaseUserId}/roles`, {
      roleIds,
      appId
    });
    return response.data;
  },
  
  createUser: async (userData) => {
    if (userData.appId) {
      userData.appId = normalizeAppId(userData.appId);
    }
    const response = await apiClient.post('/api/userlogins', userData);
    return response.data;
  },
  
  deleteUser: async (userId, appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      console.log(`Deleting user ${userId} with appId ${appId}...`);
      
      // First attempt the direct database access via our debug endpoint
      const directResponse = await apiClient.delete(`/api/debug?userId=${userId}&appId=${appId}`);
      return directResponse.data;
    } catch (directError) {
      console.error('Direct database deletion failed:', directError.message);
      
      // Try the backend API route
      try {
        appId = normalizeAppId(appId);
        const response = await apiClient.delete(`/api/userlogins/${userId}?appId=${appId}`);
        return response.data;
      } catch (firstError) {
        console.error('First API deletion attempt failed:', firstError.message);
        
        // Try alternative endpoint
        try {
          appId = normalizeAppId(appId);
          const alternativeResponse = await apiClient.delete(`/api/users/${userId}?appId=${appId}`);
          return alternativeResponse.data;
        } catch (secondError) {
          console.error('All deletion attempts failed');
          throw new Error(`Failed to delete user: ${directError.message}`);
        }
      }
    }
  },
  
  // deleteAllTempUsers method has been removed as part of the temporary users removal
};

// Roles API
export const rolesApi = {
  getRoles: async (appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      const response = await apiClient.get(`/api/roles?appId=${appId}`);
      // Handle nested response format with pagination
      if (response.data && response.data.roles && Array.isArray(response.data.roles)) {
        console.log(`Received ${response.data.roles.length} roles from API`);
        return response.data.roles;
      } else if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} roles directly as array`);
        return response.data;
      } else {
        console.warn('API returned unexpected format for roles:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching roles from backend:', error.message);
      // Don't return fallback data - let the caller handle the error
      throw error;
    }
  }
};

// Organizers API
export const organizersApi = {
  getOrganizers: async (appId = '1', active, approved) => {
    try {
      appId = normalizeAppId(appId);
      
      // Build simple query with required filter params
      let queryParams = new URLSearchParams({
        appId: appId
      });
      
      // Add a filter to satisfy the backend requirement
      queryParams.append('isActive', active !== undefined ? active : 'true');
      
      if (approved !== undefined) {
        queryParams.append('isApproved', approved);
      }
      
      // Log the URL for debugging
      const url = `/api/organizers?${queryParams.toString()}`;
      console.log('Getting organizers with URL:', url);
      
      // Use the regular endpoint with the required filters
      const response = await apiClient.get(url);
      
      // Check for different response formats
      // The API may return {organizers: Array, pagination: Object}
      if (response.data && response.data.organizers && Array.isArray(response.data.organizers)) {
        console.log(`Received ${response.data.organizers.length} organizers from API (in organizers field)`);
        return response.data.organizers;
      }
      // Or it may return {data: Array, pagination: Object}
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log(`Received ${response.data.data.length} organizers from API (in data field)`);
        return response.data.data;
      } 
      // Or it might return array directly
      else if (Array.isArray(response.data)) {
        console.log(`Received ${response.data.length} organizers directly as array`);
        return response.data;
      } 
      // Last resort: log and return empty array
      else {
        console.warn('organizersApi.getOrganizers: API response format unexpected', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error in getOrganizers:', error);
      // Return empty array to prevent UI errors
      return [];
    }
  },
  
  getOrganizerById: async (id, appId = '1') => {
    appId = normalizeAppId(appId);
    const response = await apiClient.get(`/api/organizers/${id}?appId=${appId}`);
    return response.data;
  },
  
  createOrganizer: async (organizerData) => {
    if (organizerData.appId) {
      organizerData.appId = normalizeAppId(organizerData.appId);
    }
    const response = await apiClient.post('/api/organizers', organizerData);
    return response.data;
  },
  
  updateOrganizer: async (id, organizerData) => {
    // Include appId as a query parameter
    const appId = normalizeAppId(organizerData.appId || '1');
    const response = await apiClient.patch(`/api/organizers/${id}?appId=${appId}`, organizerData);
    return response.data;
  },
  
  // Helper function to check if a Firebase ID is already in use by another organizer
  checkFirebaseIdUsage: async (firebaseUserId, currentOrganizerId, appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      // Get all organizers (this should be a small list)
      const response = await apiClient.get(`/api/organizers?appId=${appId}&isActive=true`);
      const organizers = response.data || [];
      
      // Find any organizer with this Firebase ID that is NOT the current one
      const existingOrganizer = organizers.find(org => 
        org.firebaseUserId === firebaseUserId && 
        org._id !== currentOrganizerId
      );
      
      if (existingOrganizer) {
        return {
          inUse: true,
          organizer: existingOrganizer
        };
      }
      
      return { inUse: false };
    } catch (error) {
      console.warn('Error checking Firebase ID usage:', error);
      // Default to allowing connection if we can't check
      return { inUse: false, error: error.message };
    }
  },
  
  connectToUser: async (id, firebaseUserId, appId = '1') => {
    appId = normalizeAppId(appId);
    console.log(`Connecting organizer ${id} to user ${firebaseUserId} with appId ${appId}`);
    
    // First, check if the Firebase ID is already in use
    const usageCheck = await organizersApi.checkFirebaseIdUsage(firebaseUserId, id, appId);
    if (usageCheck.inUse) {
      const msg = `Cannot connect: Firebase ID ${firebaseUserId} is already used by organizer "${usageCheck.organizer.fullName || usageCheck.organizer.name}" (ID: ${usageCheck.organizer._id})`;
      console.error(msg);
      throw new Error(msg);
    }
    
    // Try approach #1: Direct database connection using our custom API
    try {
      console.log('Attempting connection via direct database operation...');
      
      const directResponse = await fetch(`/api/organizers/${id}/connect-user`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUserId,
          appId
        }),
      });
      
      if (directResponse.ok) {
        const data = await directResponse.json();
        console.log('Connection successful via direct database operation');
        return data;
      } else {
        console.warn('Direct database connection failed:', await directResponse.text());
        // Continue to next approach
      }
    } catch (directError) {
      console.error('Error with direct database connection:', directError);
      // Continue to next approach
    }
    
    // Try approach #2: First clear any existing user connections, then update
    try {
      console.log('Attempting to clear existing connections first...');
      
      // 1. First, fetch the organizer
      const organizerResponse = await apiClient.get(`/api/organizers/${id}?appId=${appId}`);
      const organizer = organizerResponse.data;
      
      // 2. Clear the existing firebase ID if there is one
      if (organizer.firebaseUserId) {
        console.log(`Clearing existing Firebase ID ${organizer.firebaseUserId} from organizer ${id}`);
        
        // Clear the Firebase ID
        const clearResponse = await apiClient.patch(`/api/organizers/${id}`, {
          firebaseUserId: null,
          linkedUserLogin: null,
          appId: appId
        });
        
        console.log('Successfully cleared existing connection');
      }
      
      // 3. Now add the new connection
      console.log(`Adding new Firebase ID ${firebaseUserId} to organizer ${id}`);
      
      // Make a simple update request
      const updateResponse = await apiClient.patch(`/api/organizers/${id}`, {
        firebaseUserId: firebaseUserId,
        appId: appId
      });
      
      console.log('Successfully updated organizer via two-phase PATCH');
      
      // Now, try to update the user separately
      try {
        // Create route to find user by Firebase ID
        const userRoute = `/api/userlogins/firebase/${firebaseUserId}?appId=${appId}`;
        const userResponse = await apiClient.get(userRoute);
        
        if (userResponse.data) {
          const user = userResponse.data;
          
          // Update the user to include the organizer reference
          await apiClient.put(`/api/userlogins/updateUserInfo`, {
            firebaseUserId: firebaseUserId,
            appId: appId,
            regionalOrganizerInfo: {
              ...user.regionalOrganizerInfo,
              organizerId: id,
              isApproved: true,
              isEnabled: true,
              isActive: true
            }
          });
          
          console.log('Successfully updated user with organizer reference');
          
          // Add RegionalOrganizer role if not present
          const rolesResponse = await apiClient.get(`/api/roles?appId=${appId}`);
          const roles = rolesResponse.data;
          const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
          
          if (organizerRole) {
            // Ensure roleIds is an array and convert objects to IDs
            const userRoleIds = [...(user.roleIds || [])].map(role => 
              typeof role === 'object' ? role._id : role
            );
            
            // Check if role needs to be added
            if (!userRoleIds.includes(organizerRole._id)) {
              userRoleIds.push(organizerRole._id);
              await apiClient.put(`/api/userlogins/${firebaseUserId}/roles`, {
                roleIds: userRoleIds,
                appId
              });
              console.log('Added RegionalOrganizer role to user');
            }
          }
        }
      } catch (userError) {
        console.warn('Could not update user, but organizer was updated:', userError.message);
      }
      
      return {
        success: true,
        message: 'Connected user to organizer via two-phase update',
        organizer: updateResponse.data
      };
    } catch (updateError) {
      console.error('Error with two-phase update approach:', updateError);
      // Continue to fallback approach
    }
    
    // Last resort: Try our direct database endpoint
    try {
      console.log('Attempting direct database connection via debug endpoint...');
      
      // Use the debug endpoint
      const debugResponse = await fetch(`/api/debug/connect-user-to-organizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUserId,
          organizerId: id,
          appId,
          clearExisting: true
        }),
      });
      
      if (!debugResponse.ok) {
        throw new Error(`Failed to connect via debug endpoint: ${await debugResponse.text()}`);
      }
      
      const result = await debugResponse.json();
      console.log('Successfully connected via debug endpoint');
      
      return {
        success: true,
        message: 'Connected user to organizer via direct database access',
        data: result
      };
    } catch (fallbackError) {
      console.error('All connection approaches failed:', fallbackError);
      throw new Error(`Failed to connect user to organizer: ${fallbackError.message}`);
    }
  }
};

// Events API
export const eventsApi = {
  getEvents: async (filters = {}, appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      
      // Build query parameters from filters
      const { 
        active, 
        startDate, 
        endDate,
        afterEqualDate,
        beforeEqualDate,
        status, 
        organizerId, 
        venueId,
        masteredRegionName, 
        masteredDivisionName,
        masteredCityName,
        titleSearch,
        descriptionSearch,
        categories,
        page = 1,
        limit = 100
      } = filters;
      
      // Create URL with required parameters
      let queryParams = new URLSearchParams({
        appId: appId
      });
      
      // Only add pagination if not retrieving all
      if (filters.allRecords !== true) {
        queryParams.append('page', page);
        queryParams.append('limit', limit);
      }
      
      // Simplified approach - just a single flag to signal this is an explicit search
      if (filters.explicit_search) {
        queryParams.append('explicit_search', 'true');
      }
      
      // Handle active status with explicit parameter
      if (active !== undefined) {
        queryParams.append('active', active);
        // Also add as specific parameter for backend API
        queryParams.append('is_active', active);
      }
      
      // Variables to store formatted dates
      let formattedAfterEqualDate;
      let formattedBeforeEqualDate;
      
      // Handle the new date filter parameters for inclusive filtering on event start date
      
      // Process afterEqualDate (inclusive start date filter)
      if (afterEqualDate) {
        formattedAfterEqualDate = afterEqualDate;
        if (afterEqualDate instanceof Date || typeof afterEqualDate === 'object') {
          try {
            // Format as YYYY-MM-DD
            const date = new Date(afterEqualDate);
            formattedAfterEqualDate = date.toISOString().split('T')[0];
            console.log('Formatted afterEqualDate:', formattedAfterEqualDate);
          } catch (err) {
            console.warn('Error formatting afterEqualDate:', err);
          }
        }
        
        // Use 'start' parameter for filtering events that start on or after this date
        queryParams.append('start', formattedAfterEqualDate);
        // Add an additional parameter for clarity in API logs
        queryParams.append('afterEqualDate', formattedAfterEqualDate);
      }
      
      // Process beforeEqualDate (inclusive end date filter for start date)
      if (beforeEqualDate) {
        formattedBeforeEqualDate = beforeEqualDate;
        if (beforeEqualDate instanceof Date || typeof beforeEqualDate === 'object') {
          try {
            // Format as YYYY-MM-DD
            const date = new Date(beforeEqualDate);
            formattedBeforeEqualDate = date.toISOString().split('T')[0];
            console.log('Formatted beforeEqualDate:', formattedBeforeEqualDate);
          } catch (err) {
            console.warn('Error formatting beforeEqualDate:', err);
          }
        }
        
        // Use 'end' parameter for filtering events that start on or before this date
        queryParams.append('end', formattedBeforeEqualDate);
        // Add an additional parameter for clarity in API logs
        queryParams.append('beforeEqualDate', formattedBeforeEqualDate);
      }
      
      // For backward compatibility, also handle the old date parameters if they're present
      if (startDate && !afterEqualDate) {
        let formattedStartDate = startDate;
        if (startDate instanceof Date || typeof startDate === 'object') {
          try {
            const date = new Date(startDate);
            formattedStartDate = date.toISOString().split('T')[0];
          } catch (err) {
            console.warn('Error formatting legacy startDate:', err);
          }
        }
        queryParams.append('start', formattedStartDate);
      }
      
      if (endDate && !beforeEqualDate) {
        let formattedEndDate = endDate;
        if (endDate instanceof Date || typeof endDate === 'object') {
          try {
            const date = new Date(endDate);
            formattedEndDate = date.toISOString().split('T')[0];
          } catch (err) {
            console.warn('Error formatting legacy endDate:', err);
          }
        }
        queryParams.append('end', formattedEndDate);
      }
      // Handle status parameter with multiple possible formats
      if (status) {
        queryParams.append('status', status);
        
        // Convert 'all'/'active'/'inactive' to boolean for 'active' parameter if needed
        if (status === 'active' && active === undefined) {
          queryParams.append('active', 'true');
          queryParams.append('is_active', 'true');
        } else if (status === 'inactive' && active === undefined) {
          queryParams.append('active', 'false');
          queryParams.append('is_active', 'false');
        }
      }
      if (organizerId) queryParams.append('organizerId', organizerId);
      // Simplified venue ID parameter
      if (venueId) {
        console.log(`Adding venue filter, ID: ${venueId}`);
        queryParams.append('venueId', venueId);
      }
      
      // Simplified geo hierarchy filters
      if (masteredRegionName) {
        queryParams.append('masteredRegionName', masteredRegionName);
      }
      
      if (masteredDivisionName) {
        queryParams.append('masteredDivisionName', masteredDivisionName);
      }
      
      if (masteredCityName) {
        queryParams.append('masteredCityName', masteredCityName);
      }
      
      if (titleSearch) queryParams.append('titleSearch', titleSearch);
      if (descriptionSearch) queryParams.append('descriptionSearch', descriptionSearch);
      
      // Handle categories properly - can be string, array, or comma-separated list
      if (categories) {
        // Determine what type of categories we're dealing with
        if (Array.isArray(categories)) {
          // For arrays, extract each category and add individually
          const categoryList = categories
            .map(cat => {
              if (typeof cat === 'string') return cat;
              return cat.id || cat._id || cat.name || cat.categoryName || '';
            })
            .filter(id => id); // Remove empty values
            
          // Add individual category parameters for each selected category
          categoryList.forEach((category, index) => {
            queryParams.append(`category${index+1}`, category);
          });
          
          // Also add the comma-separated list
          queryParams.append('categories', categoryList.join(','));
          console.log(`Adding ${categoryList.length} categories:`, categoryList);
        } else if (typeof categories === 'string') {
          // If it's already a string, just add it
          queryParams.append('categories', categories);
        }
      }
      
      // Log a simple summary of active filters - being careful with the date variables
      const activeFilters = {
        ...(afterEqualDate && { 'startDate >=': formattedAfterEqualDate || afterEqualDate }),
        ...(beforeEqualDate && { 'startDate <=': formattedBeforeEqualDate || beforeEqualDate }),
        ...(status && { status }),
        ...(venueId && { venueId }),
        ...(masteredRegionName && { region: masteredRegionName }),
        ...(masteredDivisionName && { division: masteredDivisionName }),
        ...(masteredCityName && { city: masteredCityName }),
        ...(titleSearch && { titleSearch }),
        ...(descriptionSearch && { descriptionSearch }),
        ...(active !== undefined && { active })
      };
      
      if (Object.keys(activeFilters).length > 0) {
        console.log('Using filters:', activeFilters);
      }
      
      // Make the request
      const url = `/api/events?${queryParams.toString()}`;
      // Only log a summarized version of the URL to reduce noise
      console.log(`API request: GET ${url.substring(0, 60)}${url.length > 60 ? '...' : ''}`);
      const response = await apiClient.get(url);
      
      // Handle multiple response formats without excessive logging
      let events = [];
      let pagination = {};
      
      if (response.data && response.data.events && Array.isArray(response.data.events)) {
        events = response.data.events;
        pagination = response.data.pagination || {};
      } 
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        events = response.data.data;
        pagination = response.data.pagination || {};
      }
      else if (Array.isArray(response.data)) {
        events = response.data;
        pagination = { total: response.data.length, page: 1, pages: 1 };
      }
      
      // Just log a count of events received
      console.log(`API response: ${events.length} events received`);
      
      return { events, pagination };
    } catch (error) {
      console.error('Error fetching events:', error);
      return { events: [], pagination: {} };
    }
  },
  
  getEventById: async (id, appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      const response = await apiClient.get(`/api/events/id/${id}?appId=${appId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching event with ID ${id}:`, error);
      throw error;
    }
  },
  
  createEvent: async (eventData) => {
    try {
      const appId = normalizeAppId(eventData.appId || '1');
      const response = await apiClient.post(`/api/events/post?appId=${appId}`, eventData);
      return response.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },
  
  updateEvent: async (id, eventData) => {
    try {
      const appId = normalizeAppId(eventData.appId || '1');
      const response = await apiClient.put(`/api/events/${id}?appId=${appId}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`Error updating event with ID ${id}:`, error);
      throw error;
    }
  },
  
  deleteEvent: async (id, appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      const response = await apiClient.delete(`/api/events/${id}?appId=${appId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting event with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Additional helper methods
  toggleEventStatus: async (id, isActive, appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      const response = await apiClient.patch(`/api/events/${id}?appId=${appId}`, {
        active: isActive
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling event status for ID ${id}:`, error);
      throw error;
    }
  },
  
  getEventCounts: async (appId = '1') => {
    try {
      appId = normalizeAppId(appId);
      // Use the events endpoint with minimum data and count only
      const activeResponse = await apiClient.get(`/api/events?appId=${appId}&active=true&countOnly=true`);
      const allResponse = await apiClient.get(`/api/events?appId=${appId}&countOnly=true`);
      
      // Get upcoming events (today and future)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = today.toISOString();
      const upcomingResponse = await apiClient.get(
        `/api/events?appId=${appId}&startDate=${startDate}&countOnly=true`
      );
      
      // Get this month's events
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const endDate = endOfMonth.toISOString();
      const thisMonthResponse = await apiClient.get(
        `/api/events?appId=${appId}&startDate=${startDate}&endDate=${endDate}&countOnly=true`
      );
      
      return {
        total: allResponse.data?.pagination?.total || 0,
        active: activeResponse.data?.pagination?.total || 0,
        upcoming: upcomingResponse.data?.pagination?.total || 0,
        thisMonth: thisMonthResponse.data?.pagination?.total || 0
      };
    } catch (error) {
      console.error('Error fetching event counts:', error);
      // Return defaults
      return {
        total: 0,
        active: 0,
        upcoming: 0,
        thisMonth: 0
      };
    }
  }
};

// Debug API
export const debugApi = {
  checkBackend: async () => {
    try {
      const response = await apiClient.get('/health');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default {
  users: usersApi,
  roles: rolesApi,
  organizers: organizersApi,
  events: eventsApi,
  debug: debugApi
};