'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '@/lib/AppContext';
import venuesApi from '@/lib/api-client/venues';

/**
 * Custom hook for fetching and managing venues data
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID (default: from AppContext)
 * @param {Object} [options.initialFilters] - Initial filter settings
 * @param {string} [options.initialFilters.searchTerm] - Initial search term
 * @param {number} [options.initialFilters.tabValue] - Initial tab value
 * @param {Object} [options.cacheOptions] - Cache configuration
 * @param {number} [options.cacheOptions.maxAge] - Maximum cache age in ms (default: 2 minutes)
 * @returns {Object} Venues data and operations
 */
const useVenues = (options = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const appId = options.appId || currentApp?.id || '1';
  
  // Cache configuration with defaults
  const cacheOptions = {
    maxAge: 2 * 60 * 1000, // 2 minutes in milliseconds
    ...(options.cacheOptions || {})
  };
  
  // State for venues data
  const [venues, setVenues] = useState([]);
  const [filteredVenues, setFilteredVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState(options.initialFilters?.searchTerm || '');
  const [tabValue, setTabValue] = useState(options.initialFilters?.tabValue || 0);
  
  // State for pagination - default to max page size
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 500, // Use max API limit
    totalCount: 0
  });

  /**
   * Process venue data from API to add computed fields
   * @param {Array} venuesData - Raw venues data from API
   * @returns {Array} Processed venues with computed fields
   */
  const processVenues = useCallback((venuesData) => {
    if (!Array.isArray(venuesData)) return [];
    
    const processed = [];
    const failed = [];
    
    venuesData.forEach((venue, index) => {
      try {
        // Normalize venue properties with fallbacks for different API response formats
        const normalizedVenue = {
        ...venue,
        _id: venue._id || venue.id, // Support both _id and id
        name: venue.name || venue.venueName || venue.venue_name || '',
        location: venue.location || venue.geolocation || {
          coordinates: venue.coordinates || 
                      (venue.longitude && venue.latitude ? [venue.longitude, venue.latitude] : null)
        },
        address: venue.address || {
          street1: venue.address1 || venue.street || venue.streetAddress || '',
          street2: venue.address2 || '',
          city: venue.city || '',
          state: venue.state || venue.stateProvince || '',
          country: venue.country || ''
        },
        masteredCityId: venue.masteredCityId || venue.cityId || null,
        masteredRegionId: venue.masteredRegionId || venue.regionId || null,
        masteredCityName: venue.masteredCityName || venue.cityName || '',
        masteredRegionName: venue.masteredRegionName || venue.regionName || '',
        isActive: venue.isActive !== undefined ? venue.isActive : true,
        isApproved: venue.isApproved !== undefined ? venue.isApproved : false
      };
      
      // Add computed fields for UI
      const processedVenue = {
        ...normalizedVenue,
        id: normalizedVenue._id, // Ensure id exists for DataGrid key
        displayName: normalizedVenue.name || 'Unnamed Venue',
        hasCoordinates: !!(normalizedVenue.location?.coordinates && 
                        Array.isArray(normalizedVenue.location.coordinates) && 
                        normalizedVenue.location.coordinates.length === 2),
        hasValidGeo: !!(normalizedVenue.location?.coordinates && normalizedVenue.masteredCityId),
        cityName: normalizedVenue.masteredCityName || 'Unknown',
        regionName: normalizedVenue.masteredRegionName || 'Unknown',
        // Add state and zip if available from various sources
        state: normalizedVenue.state || normalizedVenue.address?.state || '',
        zip: normalizedVenue.zip || normalizedVenue.address?.zip || normalizedVenue.postalCode || '',
        // Add geo update timestamp
        lastGeoUpdate: normalizedVenue.geoUpdatedAt || normalizedVenue.lastGeoUpdate || null,
        locationString: [
          normalizedVenue.name,
          normalizedVenue.address?.street1,
          normalizedVenue.address?.city,
          normalizedVenue.address?.state,
          normalizedVenue.address?.country
        ].filter(Boolean).join(', ')
      };
      
      processed.push(processedVenue);
      } catch (error) {
        console.error(`Error processing venue at index ${index}:`, error);
        failed.push({ index, error: error.message });
      }
    });
    
    if (failed.length > 0) {
      console.warn(`Failed to process ${failed.length} venues:`, failed);
    }
    
    return processed;
  }, []);

  /**
   * Fetch venues from the API with improved error handling and retries
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @param {number} [retryCount=0] - Current retry attempt count
   * @returns {Promise<Array>} Fetched and processed venues
   */
  const fetchVenues = useCallback(async (forceRefresh = false, retryCount = 0) => {
    // Skip fetch if we have venues and aren't forcing a refresh
    if (venues.length > 0 && !forceRefresh && lastUpdated) {
      // Only use cached data if it's less than the configured cache age
      const cacheAge = Date.now() - lastUpdated;
      if (cacheAge < cacheOptions.maxAge) {
        console.log(`Using cached venues data (age: ${Math.round(cacheAge/1000)}s)`);
        return venues;
      }
    }

    try {
      // Don't set loading state immediately if we have cached data
      // This prevents UI flicker when refreshing in the background
      if (venues.length === 0 || forceRefresh) {
        setLoading(true);
      }
      setError(null);
      
      // Add timestamp to force fresh data
      const timestamp = Date.now();
      
      // Always ensure appId is a string
      let normalizedAppId = appId;
      if (typeof normalizedAppId === 'object' && normalizedAppId !== null) {
        console.warn('Object passed as appId in fetchVenues, normalizing', normalizedAppId);
        normalizedAppId = normalizedAppId.id || '1';
      }
      
      // Fetch venues from API with optimized options
      let venuesData;
      try {
        // Use venues API client instead of direct axios call
        venuesData = await venuesApi.getVenues({
          appId: normalizedAppId,
          timestamp: timestamp
        });
        
        // Handle empty array case
        if (!Array.isArray(venuesData)) {
          console.warn('Received non-array venues data:', venuesData);
          venuesData = [];
        }
      } catch (fetchError) {
        // Enhanced retry logic for transient network issues
        if (retryCount < 2) { // Allow up to 2 retries (3 attempts total)
          console.warn(`Error fetching venues, retrying (attempt ${retryCount + 1}/3)...`, fetchError);
          
          // Exponential backoff with jitter to prevent thundering herd
          const baseDelay = 1000 * Math.pow(2, retryCount);
          const jitter = Math.random() * 500; // Add up to 500ms of random jitter
          const delay = baseDelay + jitter;
          
          console.log(`Retrying after ${Math.round(delay)}ms delay`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchVenues(forceRefresh, retryCount + 1);
        }
        throw fetchError; // Re-throw if we've exhausted retries
      }
      
      // Process venues data
      const processedVenues = processVenues(venuesData);
      
      // Update state, but only if we got valid data
      if (Array.isArray(processedVenues) && processedVenues.length > 0) {
        setVenues(processedVenues);
        setLastUpdated(Date.now());
        
        // Update pagination total count
        setPagination(prev => ({
          ...prev,
          totalCount: processedVenues.length
        }));
        
        console.log(`Successfully fetched and processed ${processedVenues.length} venues`);
      } else if (venuesData.length === 0) {
        // If we got an empty array but it's valid, update the state
        setVenues([]);
        setLastUpdated(Date.now());
        setPagination(prev => ({
          ...prev,
          totalCount: 0
        }));
        console.log('Received 0 venues from API (valid empty result)');
      } else {
        console.warn('Invalid venues data received:', venuesData);
        // If we have existing venues data, don't overwrite it with bad data
        if (venues.length === 0) {
          setVenues([]);
          setPagination(prev => ({
            ...prev,
            totalCount: 0
          }));
        }
      }
      
      return processedVenues;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error(`Error fetching venues: ${errorMessage}`, err);
      setError(err);
      
      // Don't return empty array if we have existing data
      return venues.length > 0 ? venues : [];
    } finally {
      setLoading(false);
    }
  }, [appId, venues, lastUpdated, processVenues, cacheOptions.maxAge]);

  // Fetch venues when the hook is first mounted and when appId changes
  useEffect(() => {
    // Check if the data in the cache is fresh enough
    const cacheAge = lastUpdated ? Date.now() - lastUpdated : Infinity;
    
    if (cacheAge > cacheOptions.maxAge || venues.length === 0) {
      fetchVenues();
    }
    
    // Set up refresh interval if needed, but avoid constant polling
    const refreshInterval = 60000; // 1 minute refresh
    const intervalId = setTimeout(() => {
      fetchVenues();
    }, refreshInterval);
    
    // Clean up interval on unmount
    return () => {
      clearTimeout(intervalId);
    };
  }, [fetchVenues, appId]);

  /**
   * Filter venues based on search term and current tab
   * @param {string} [term] - Search term to filter by (defaults to current searchTerm)
   * @param {number} [tab] - Tab value to filter by (defaults to current tabValue)
   */
  const filterVenues = useCallback((term = searchTerm, tab = tabValue) => {
    try {
      let filtered = venues;
      
      // Apply tab filtering
      if (tab === 1) { // Validated venues
        filtered = filtered.filter(venue => venue.hasValidGeo);
      } else if (tab === 2) { // Invalid venues
        filtered = filtered.filter(venue => !venue.hasValidGeo);
      }
      
      // Apply search term filtering
      if (term) {
        const lowerTerm = term.toLowerCase();
        filtered = filtered.filter(venue => {
          try {
            // Add optional chaining for all properties to prevent null/undefined errors
            return (
              (venue.displayName?.toLowerCase()?.includes(lowerTerm) || false) ||
              (venue.cityName?.toLowerCase()?.includes(lowerTerm) || false) ||
              (venue.regionName?.toLowerCase()?.includes(lowerTerm) || false) ||
              (venue.locationString?.toLowerCase()?.includes(lowerTerm) || false)
            );
          } catch (error) {
            console.error(`Error filtering venue ${venue.id || 'unknown'}:`, error);
            return false; // Skip this venue on error
          }
        });
      }
      
      // Update pagination information
      setPagination(prev => ({
        ...prev,
        totalCount: filtered.length,
        page: 0 // Reset to first page on new search
      }));
      
      // Update filtered venues
      setFilteredVenues(filtered);
    } catch (err) {
      console.error('Error in filterVenues:', err);
      // On error, reset to showing all venues
      setFilteredVenues(venues);
    }
  }, [venues, searchTerm, tabValue]);

  // Keep filtered venues in sync with venues, searchTerm, and tabValue
  useEffect(() => {
    filterVenues(searchTerm, tabValue);
  }, [venues, searchTerm, tabValue, filterVenues]);

  /**
   * Get a venue by ID
   * @param {string} venueId - Venue ID
   * @returns {Object|undefined} Venue object or undefined if not found
   */
  const getVenueById = useCallback((venueId) => {
    if (!venueId) return undefined;
    return venues.find(venue => venue._id === venueId || venue.id === venueId);
  }, [venues]);

  /**
   * Create a new venue with enhanced error handling
   * @param {Object} venueData - Venue data
   * @returns {Promise<Object>} Created venue
   */
  const createVenue = useCallback(async (venueData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Process input data
      const venueDataWithAppId = {
        ...venueData,
        appId: venueData.appId || appId
      };
      
      // Create venue using API client
      const createdVenue = await venuesApi.createVenue(venueDataWithAppId);
      
      // Refresh venues list
      await fetchVenues(true);
      
      return createdVenue;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchVenues]);

  /**
   * Update an existing venue
   * @param {Object} venueData - Venue data with updates
   * @returns {Promise<Object>} Updated venue
   */
  const updateVenue = useCallback(async (venueData) => {
    try {
      setLoading(true);
      setError(null);
      
      const { id, _id, ...data } = venueData;
      const venueId = _id || id;
      
      if (!venueId) {
        throw new Error('Venue ID is required for update');
      }
      
      // Debug: Log the data being sent
      console.log('Updating venue with data:', {
        ...data,
        appId: data.appId || appId
      });
      
      // Update venue using API client
      const updatedVenue = await venuesApi.updateVenue(venueId, {
        ...data,
        appId: data.appId || appId
      });
      
      // Refresh venues list
      await fetchVenues(true);
      
      return updatedVenue;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchVenues]);

  /**
   * Delete a venue
   * @param {string} venueId - Venue ID
   * @returns {Promise<void>}
   */
  const deleteVenue = useCallback(async (venueId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete venue using API client
      await venuesApi.deleteVenue(venueId, appId);
      
      // Refresh venues list
      await fetchVenues(true);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchVenues]);

  /**
   * Validate venue geolocation
   * @param {string} venueId - Venue ID
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation result
   */
  const validateVenueGeo = useCallback(async (venueId, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate venue using API client
      const result = await venuesApi.validateGeolocation(venueId, {
        ...options,
        appId: options.appId || appId
      });
      
      // Refresh venues list
      await fetchVenues(true);
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchVenues]);

  /**
   * Batch validate venue geolocations
   * @param {Array<string>} venueIds - Array of venue IDs
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Validation results
   */
  const batchValidateGeo = useCallback(async (venueIds, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      // Batch validate venues using API client
      const result = await venuesApi.batchValidateGeolocation(venueIds, {
        ...options,
        appId: options.appId || appId
      });
      
      // Refresh venues list
      await fetchVenues(true);
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appId, fetchVenues]);

  /**
   * Reset filters to their initial state
   */
  const resetFilters = useCallback(() => {
    setSearchTerm(options.initialFilters?.searchTerm || '');
    setTabValue(options.initialFilters?.tabValue || 0);
  }, [options.initialFilters]);

  // Memoize the public API to prevent unnecessary re-renders
  const api = useMemo(() => ({
    // Data
    venues,
    filteredVenues,
    loading,
    error,
    
    // Filters
    searchTerm,
    setSearchTerm,
    tabValue,
    setTabValue,
    filterVenues,
    resetFilters,
    
    // Pagination
    pagination,
    setPagination,
    
    // Operations
    fetchVenues,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
    validateVenueGeo,
    batchValidateGeo
  }), [
    venues,
    filteredVenues,
    loading,
    error,
    searchTerm,
    tabValue,
    pagination,
    fetchVenues,
    filterVenues,
    resetFilters,
    getVenueById,
    createVenue,
    updateVenue,
    deleteVenue,
    validateVenueGeo,
    batchValidateGeo,
    setPagination,
    setSearchTerm,
    setTabValue
  ]);

  return api;
};

export default useVenues;