'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing event filters
 * @param {Object} initialFilters - Initial filter values
 * @param {Function} onFilterChange - Callback function when filters change
 * @returns {Object} Current filters and functions to manipulate them
 */
const useEventFilters = (initialFilters = {}, onFilterChange = null) => {
  // Get today and today+3weeks for default dates
  const today = new Date();
  const threeWeeksLater = new Date();
  threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);
  
  // State for filters
  const [filters, setFilters] = useState({
    titleSearch: '',
    descriptionSearch: '',
    startDate: today,
    endDate: threeWeeksLater,
    status: 'all',
    masteredRegionName: '',
    masteredDivisionName: '',
    masteredCityName: '',
    categories: [],
    organizerId: '',
    venueId: '',
    active: true,
    ...initialFilters
  });
  
  // Effect to call onFilterChange when filters change
  useEffect(() => {
    if (onFilterChange && typeof onFilterChange === 'function') {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);
  
  // Function to update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // Function to update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);
  
  // Function to clear all filters
  const clearFilters = useCallback(() => {
    // Reset to defaults
    const today = new Date();
    const threeWeeksLater = new Date();
    threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);
    
    setFilters({
      titleSearch: '',
      descriptionSearch: '',
      startDate: today,
      endDate: threeWeeksLater,
      status: 'all',
      masteredRegionName: '',
      masteredDivisionName: '',
      masteredCityName: '',
      categories: [],
      organizerId: '',
      venueId: '',
      active: true
    });
  }, []);
  
  // Function to check if any filters are active
  const hasActiveFilters = useCallback(() => {
    // Get today's date to check if startDate is not default
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today+21 days to check if endDate is not default
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 21);
    defaultEndDate.setHours(0, 0, 0, 0);
    
    // Format dates for comparison
    const startDateStr = filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
    const endDateStr = filters.endDate ? new Date(filters.endDate).setHours(0, 0, 0, 0) : null;
    
    // Debug logs to verify geo hierarchy filters
    if (filters.masteredRegionName) {
      console.log('Active Region Filter:', filters.masteredRegionName);
    }
    if (filters.masteredDivisionName) {
      console.log('Active Division Filter:', filters.masteredDivisionName);
    }
    if (filters.masteredCityName) {
      console.log('Active City Filter:', filters.masteredCityName);
    }
    
    return (
      !!filters.titleSearch ||
      !!filters.descriptionSearch ||
      (startDateStr && startDateStr !== today.getTime()) ||
      (endDateStr && endDateStr !== defaultEndDate.getTime()) ||
      filters.status !== 'all' ||
      !!filters.masteredRegionName ||
      !!filters.masteredDivisionName ||
      !!filters.masteredCityName ||
      !!filters.organizerId ||
      !!filters.venueId ||
      (filters.categories && filters.categories.length > 0)
    );
  }, [filters]);
  
  return {
    filters,
    setFilters,
    updateFilter,
    updateFilters,
    clearFilters,
    hasActiveFilters
  };
};

export default useEventFilters;