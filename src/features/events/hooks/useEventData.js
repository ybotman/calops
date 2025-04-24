'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { eventsApi } from '@/lib/api-client';
import { formatISO } from 'date-fns';

/**
 * Custom hook for managing event data with filtering, pagination, and search
 * @param {string} appId - Application ID
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Event data, loading state, error state, and functions to manipulate the data
 */
const useEventData = (appId = '1', initialFilters = {}) => {
  // State for events data
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
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
    return new Promise(async (resolve, reject) => {
      setLoading(true);
      setError(null);
    
    try {
      // Prepare filter parameters
      const filterParams = {};
      
      // Add title search filter
      if (filters.titleSearch) {
        filterParams.titleSearch = filters.titleSearch;
      }
      
      // Add description search filter
      if (filters.descriptionSearch) {
        filterParams.descriptionSearch = filters.descriptionSearch;
      }
      
      // Add date filters if provided - use formatISO for proper API format (YYYY-MM-DD)
      if (filters.startDate) {
        try {
          // Format as ISO date string following API expectations
          filterParams.startDate = formatISO(new Date(filters.startDate), { representation: 'date' });
          
          // The API expects 'start' parameter (not 'startDate')
          filterParams.start = filterParams.startDate;
          
          // Remove the original property to avoid confusion
          delete filterParams.startDate;
        } catch (err) {
          console.warn('Error formatting startDate:', err);
        }
      }
      
      if (filters.endDate) {
        try {
          // Format as ISO date string following API expectations
          filterParams.endDate = formatISO(new Date(filters.endDate), { representation: 'date' });
          
          // The API expects 'end' parameter (not 'endDate')
          filterParams.end = filterParams.endDate;
          
          // Remove the original property to avoid confusion
          delete filterParams.endDate;
        } catch (err) {
          console.warn('Error formatting endDate:', err);
        }
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
      
      if (filters.masteredDivisionName) {
        filterParams.masteredDivisionName = filters.masteredDivisionName;
      }
      
      if (filters.masteredCityName) {
        filterParams.masteredCityName = filters.masteredCityName;
      }
      
      // Add organizer filter
      if (filters.organizerId) {
        filterParams.organizerId = filters.organizerId;
      }
      
      // Add venue filter
      if (filters.venueId) {
        filterParams.venueId = filters.venueId;
      }
      
      // Add categories filter
      if (filters.categories && filters.categories.length > 0) {
        filterParams.categories = filters.categories.map(c => typeof c === 'object' ? c.id || c._id || c.name : c).join(',');
      }
      
      // Add pagination
      filterParams.page = pagination.page;
      filterParams.limit = pagination.limit;
      
      // Log the exact params being sent to verify our date range parameters
      console.log('Fetching events with parameters:', {
        ...filterParams,
        dateRange: {
          start: filterParams.start,
          end: filterParams.end
        }
      });
    
      // Fetch events from API
      const response = await eventsApi.getEvents(filterParams, appId);
      
      // Log the response to verify date filtering worked
      console.log('API response:', {
        totalEvents: response.events?.length || 0,
        pagination: response.pagination,
        queryInfo: response.query
      });
      
      // Update state if component is still mounted
      if (isMounted.current) {
        setEvents(response.events || []);
        setPagination({
          ...pagination,
          total: response.pagination?.total || response.events?.length || 0,
          pages: response.pagination?.pages || 1
        });
        setLoading(false);
        resolve();
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load events');
        setLoading(false);
        reject(err);
      }
    }
    });
  }, [appId, filters, pagination.page, pagination.limit]);
  
  // Initial fetch and refetch when filters change - only auto-fetch on mount
  useEffect(() => {
    // Only set loading state to true if we need to fetch data automatically on mount
    const hasInitialFilters = Object.keys(initialFilters).length > 0;
    if (hasInitialFilters) {
      fetchEvents();
    }
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);  // Empty dependency array means this only runs once on mount
  
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
  
  // Function to refresh events - returns the promise from fetchEvents
  // Now accepts an optional overrideFilters parameter to force specific filter values
  const refreshEvents = useCallback((overrideFilters = null) => {
    setLoading(true); // Explicitly set loading to true when refreshing
    
    // If overrideFilters is provided, temporarily use those filters for this request
    if (overrideFilters) {
      console.log('Using override filters for this search:', {
        region: overrideFilters.masteredRegionName,
        division: overrideFilters.masteredDivisionName,
        city: overrideFilters.masteredCityName,
        venue: overrideFilters.venueId,
        dates: {
          start: overrideFilters.startDate,
          end: overrideFilters.endDate
        },
        status: overrideFilters.status,
        active: overrideFilters.active
      });
      
      // Just add a simple explicit_search flag
      overrideFilters.explicit_search = true;
      
      // Create a custom fetchEvents function with the override filters
      const fetchWithOverride = async () => {
        try {
          console.log('Executing search with all filters:', overrideFilters);
          const response = await eventsApi.getEvents(overrideFilters, appId);
          
          if (isMounted.current) {
            // Make sure we're really setting an empty array if no events are returned
            const receivedEvents = response.events || [];
            setEvents(receivedEvents);
            console.log(`Setting ${receivedEvents.length} events in state`);
            
            setPagination({
              ...pagination,
              total: response.pagination?.total || receivedEvents.length || 0,
              pages: response.pagination?.pages || 1
            });
            setLoading(false);
            return response;
          }
        } catch (err) {
          console.error('Error fetching events with override filters:', err);
          if (isMounted.current) {
            setError(err.message || 'Failed to load events');
            setLoading(false);
          }
          throw err;
        }
      };
      
      return fetchWithOverride();
    }
    
    // Otherwise use the normal fetchEvents
    return fetchEvents()
      .catch(error => {
        console.error('Error refreshing events:', error);
        setError(error.message || 'Failed to refresh events');
        setLoading(false); // Ensure loading is reset even on error
        throw error; // Re-throw to allow proper error handling
      });
  }, [fetchEvents, appId, pagination]);
  
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