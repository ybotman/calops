'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing event filters
 * @param {Object} initialFilters - Initial filter values
 * @param {Function} onFilterChange - Callback function when filters change
 * @returns {Object} Current filters and functions to manipulate them
 */
const useEventFilters = (initialFilters = {}, onFilterChange = null) => {
  // State for filters
  const [filters, setFilters] = useState({
    search: '',
    startDate: null,
    endDate: null,
    status: 'all',
    masteredRegionName: '',
    masteredCityName: '',
    organizerId: '',
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
    setFilters({
      search: '',
      startDate: null,
      endDate: null,
      status: 'all',
      masteredRegionName: '',
      masteredCityName: '',
      organizerId: '',
      active: true
    });
  }, []);
  
  // Function to check if any filters are active
  const hasActiveFilters = useCallback(() => {
    return (
      !!filters.search ||
      !!filters.startDate ||
      !!filters.endDate ||
      filters.status !== 'all' ||
      !!filters.masteredRegionName ||
      !!filters.masteredCityName ||
      !!filters.organizerId
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