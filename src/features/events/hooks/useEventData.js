'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { eventsApi } from '@/lib/api-client';

/**
 * Custom hook for managing event data with filtering, pagination, and search
 * @param {string} appId - Application ID
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Event data, loading state, error state, and functions to manipulate the data
 */
const useEventData = (appId = '1', initialFilters = {}) => {
  // State for events data
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
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
  
  // Ref to track if component is mounted
  const isMounted = useRef(true);
  
  // Function to fetch events with current filters and pagination
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare filter parameters
      const filterParams = {};
      
      // Add search filter if provided
      if (filters.search) {
        filterParams.search = filters.search;
      }
      
      // Add date filters if provided
      if (filters.startDate) {
        filterParams.startDate = new Date(filters.startDate).toISOString();
      }
      
      if (filters.endDate) {
        filterParams.endDate = new Date(filters.endDate).toISOString();
      }
      
      // Add status filter (active/inactive)
      if (filters.status === 'active') {
        filterParams.active = true;
      } else if (filters.status === 'inactive') {
        filterParams.active = false;
      }
      
      // Add location filters
      if (filters.masteredRegionName) {
        filterParams.masteredRegionName = filters.masteredRegionName;
      }
      
      if (filters.masteredCityName) {
        filterParams.masteredCityName = filters.masteredCityName;
      }
      
      // Add organizer filter
      if (filters.organizerId) {
        filterParams.organizerId = filters.organizerId;
      }
      
      // Add pagination
      filterParams.page = pagination.page;
      filterParams.limit = pagination.limit;
      
      // Fetch events from API
      const response = await eventsApi.getEvents(filterParams, appId);
      
      // Update state if component is still mounted
      if (isMounted.current) {
        setEvents(response.events || []);
        setPagination({
          ...pagination,
          total: response.pagination?.total || response.events?.length || 0,
          pages: response.pagination?.pages || 1
        });
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load events');
        setLoading(false);
      }
    }
  }, [appId, filters, pagination.page, pagination.limit]);
  
  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchEvents();
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [fetchEvents]);
  
  // Reset component mount state when remounted
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Function to handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
    setFilters(newFilters);
  }, []);
  
  // Function to handle page change
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);
  
  // Function to handle rows per page change
  const handleRowsPerPageChange = useCallback((newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);
  
  // Function to refresh events
  const refreshEvents = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  // Function to clear filters
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
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Function to toggle event status
  const toggleEventStatus = useCallback(async (eventId, active) => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      await eventsApi.toggleEventStatus(eventId, active, appId);
      
      // Refresh events after status change
      fetchEvents();
    } catch (err) {
      console.error(`Error toggling event status for ${eventId}:`, err);
      setError(err.message || 'Failed to update event status');
      setLoading(false);
    }
  }, [appId, fetchEvents]);
  
  // Function to delete an event
  const deleteEvent = useCallback(async (eventId) => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      await eventsApi.deleteEvent(eventId, appId);
      
      // Refresh events after deletion
      fetchEvents();
    } catch (err) {
      console.error(`Error deleting event ${eventId}:`, err);
      setError(err.message || 'Failed to delete event');
      setLoading(false);
    }
  }, [appId, fetchEvents]);
  
  return {
    events,
    loading,
    error,
    filters,
    pagination,
    setFilters: handleFilterChange,
    setPage: handlePageChange,
    setRowsPerPage: handleRowsPerPageChange,
    refreshEvents,
    clearFilters,
    toggleEventStatus,
    deleteEvent
  };
};

export default useEventData;