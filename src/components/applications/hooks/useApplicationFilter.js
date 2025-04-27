/**
 * useApplicationFilter - Custom hook for filtering applications
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

const useApplicationFilter = ({ applications = [], initialFilters = {} }) => {
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const [activeFilter, setActiveFilter] = useState(
    initialFilters.activeFilter !== undefined ? initialFilters.activeFilter : null
  );
  const [tabValue, setTabValue] = useState(initialFilters.tabValue || 0);

  // Debounced search term change handler
  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((event, newValue) => {
    setTabValue(newValue);
    
    // Update active filter based on tab
    switch (newValue) {
      case 0: // All applications
        setActiveFilter(null);
        break;
      case 1: // Active applications
        setActiveFilter(true);
        break;
      case 2: // Inactive applications
        setActiveFilter(false);
        break;
      default:
        setActiveFilter(null);
    }
  }, []);

  // Filter applications based on search term and active status
  const filteredApplications = useMemo(() => {
    if (!applications || applications.length === 0) {
      return [];
    }

    return applications.filter(application => {
      // Filter by active status if specified
      if (activeFilter !== null && application.isActive !== activeFilter) {
        return false;
      }

      // Filter by search term if provided
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return (
          application.name?.toLowerCase().includes(term) ||
          application.description?.toLowerCase().includes(term) ||
          application.appId?.toLowerCase().includes(term) ||
          application.url?.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [applications, searchTerm, activeFilter]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setActiveFilter(null);
    setTabValue(0);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    handleSearchChange,
    activeFilter,
    setActiveFilter,
    tabValue,
    setTabValue,
    handleTabChange,
    filteredApplications,
    resetFilters
  };
};

export default useApplicationFilter;