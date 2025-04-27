'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for filtering venues
 * @param {Object} options - Hook options
 * @param {Array} options.venues - Array of venues to filter
 * @param {Object} [options.initialFilters] - Initial filter values
 * @param {string} [options.initialFilters.searchTerm] - Initial search term
 * @param {number} [options.initialFilters.tabValue] - Initial tab value
 * @param {Object} [options.initialFilters.customFilters] - Initial custom filters
 * @param {number} [options.debounceMs] - Debounce time for search in milliseconds
 * @returns {Object} Filtering state and operations
 */
const useVenueFilter = ({ venues = [], initialFilters = {}, debounceMs = 300 }) => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [tabValue, setTabValue] = useState(initialFilters.tabValue || 0);
  const [customFilters, setCustomFilters] = useState(initialFilters.customFilters || {});
  
  // Set up debounce for search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);
  
  /**
   * Apply tab-based filtering
   * @param {Array} venueList - Venues array to filter
   * @param {number} tab - Tab value
   * @returns {Array} Filtered venues
   */
  const applyTabFilter = useCallback((venueList, tab) => {
    if (!Array.isArray(venueList) || venueList.length === 0) {
      return [];
    }
    
    if (tab === 0) {
      // All venues tab - no filtering
      return venueList;
    }
    
    if (tab === 1) {
      // Validated venues tab - filter by valid geo
      return venueList.filter(venue => venue.hasValidGeo);
    }
    
    if (tab === 2) {
      // Invalid geo tab - filter by invalid geo
      return venueList.filter(venue => !venue.hasValidGeo);
    }
    
    // Default - no filtering
    return venueList;
  }, []);

  /**
   * Apply search term filtering
   * @param {Array} venueList - Venues array to filter
   * @param {string} term - Search term
   * @returns {Array} Filtered venues
   */
  const applySearchFilter = useCallback((venueList, term) => {
    if (!Array.isArray(venueList) || venueList.length === 0 || !term) {
      return venueList;
    }
    
    const lowerTerm = term.toLowerCase();
    return venueList.filter(venue => {
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
  }, []);

  /**
   * Apply custom filters
   * @param {Array} venueList - Venues array to filter
   * @param {Object} filters - Custom filters object
   * @returns {Array} Filtered venues
   */
  const applyCustomFilters = useCallback((venueList, filters) => {
    if (!Array.isArray(venueList) || venueList.length === 0 || !filters || Object.keys(filters).length === 0) {
      return venueList;
    }
    
    let filtered = [...venueList];
    
    // Apply each custom filter
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      filtered = filtered.filter(venue => {
        try {
          // Handle special cases
          if (key === 'isActive') {
            return venue.active === value;
          }
          
          if (key === 'hasCoordinates') {
            return value === venue.hasCoordinates;
          }
          
          if (key === 'hasValidGeo') {
            return value === venue.hasValidGeo;
          }
          
          if (key === 'cityId') {
            return venue.masteredCityId === value;
          }
          
          if (key === 'regionId') {
            return venue.masteredRegionId === value;
          }
          
          // Handle deeply nested properties
          if (key.includes('.')) {
            return key.split('.').reduce((obj, prop, index, parts) => {
              // Last part is the value to compare
              if (index === parts.length - 1) {
                return obj?.[prop] === value;
              }
              // Navigate through the object
              return obj?.[prop];
            }, venue);
          }
          
          // Handle regular properties
          return venue[key] === value;
        } catch (error) {
          console.error(`Error applying filter ${key} to venue ${venue.id || 'unknown'}:`, error);
          return true; // Skip this filter on error
        }
      });
    });
    
    return filtered;
  }, []);

  /**
   * Apply all filters to the venues array
   * @param {Array} [venueList] - Venues array to filter (defaults to venues prop)
   * @returns {Array} Filtered venues
   */
  const applyFilters = useCallback((venueList = venues) => {
    try {
      if (!Array.isArray(venueList) || venueList.length === 0) {
        return [];
      }
      
      // Apply filters in sequence
      let filtered = [...venueList];
      
      // 1. Apply tab filter
      filtered = applyTabFilter(filtered, tabValue);
      
      // 2. Apply search filter
      filtered = applySearchFilter(filtered, debouncedSearchTerm);
      
      // 3. Apply custom filters
      filtered = applyCustomFilters(filtered, customFilters);
      
      return filtered;
    } catch (error) {
      console.error('Error applying filters:', error);
      return [];
    }
  }, [
    venues, 
    tabValue, 
    debouncedSearchTerm, 
    customFilters, 
    applyTabFilter, 
    applySearchFilter, 
    applyCustomFilters
  ]);
  
  // Get filtered venues with memoization
  const filteredVenues = useMemo(() => {
    return applyFilters(venues);
  }, [venues, applyFilters]);
  
  /**
   * Add a custom filter
   * @param {string} key - Filter key
   * @param {any} value - Filter value
   */
  const addFilter = useCallback((key, value) => {
    setCustomFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);
  
  /**
   * Remove a custom filter
   * @param {string} key - Filter key to remove
   */
  const removeFilter = useCallback((key) => {
    setCustomFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);
  
  /**
   * Clear all filters
   * @param {Object} [options] - Clear options
   * @param {boolean} [options.keepTab=false] - Whether to keep tab selection
   * @param {boolean} [options.keepSearch=false] - Whether to keep search term
   */
  const clearFilters = useCallback(({ keepTab = false, keepSearch = false } = {}) => {
    if (!keepSearch) {
      setSearchTerm('');
    }
    
    if (!keepTab) {
      setTabValue(0);
    }
    
    setCustomFilters({});
  }, []);
  
  /**
   * Reset to initial filters
   */
  const resetFilters = useCallback(() => {
    setSearchTerm(initialFilters.searchTerm || '');
    setTabValue(initialFilters.tabValue || 0);
    setCustomFilters(initialFilters.customFilters || {});
  }, [initialFilters]);
  
  // Memoize the return value to prevent unnecessary rerenders
  const api = useMemo(() => ({
    // Results
    filteredVenues,
    
    // Filter state
    searchTerm,
    tabValue,
    customFilters,
    
    // Setters
    setSearchTerm,
    setTabValue,
    
    // Filter operations
    addFilter,
    removeFilter,
    clearFilters,
    resetFilters,
    
    // Utilities
    applyFilters,
    applyTabFilter,
    applySearchFilter,
    applyCustomFilters
  }), [
    filteredVenues,
    searchTerm,
    tabValue,
    customFilters,
    setSearchTerm,
    setTabValue,
    addFilter,
    removeFilter,
    clearFilters,
    resetFilters,
    applyFilters,
    applyTabFilter,
    applySearchFilter,
    applyCustomFilters
  ]);
  
  return api;
};

export default useVenueFilter;