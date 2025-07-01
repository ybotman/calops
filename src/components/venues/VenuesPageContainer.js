'use client';

import React, { useState, useEffect, useCallback } from 'react';
import VenuesPage from './VenuesPage';
import { 
  useVenues, 
  useGeoHierarchy,
  useVenueFilter
} from './hooks';
import venuesApi from '@/lib/api-client/venues';
import { useAppContext } from '@/lib/AppContext';

/**
 * VenuesPageContainer component
 * Container component that manages state and data fetching for the VenuesPage
 */
const VenuesPageContainer = () => {
  const { currentApp } = useAppContext();
  
  // Add state for division and city filtering
  const [filterDivision, setFilterDivision] = useState('');
  const [filterCity, setFilterCity] = useState('');
  
  // Use the hooks to fetch and manage data
  const venuesHook = useVenues({
    initialFilters: {
      searchTerm: '',
      tabValue: 0
    },
    cacheOptions: {
      maxAge: 5 * 60 * 1000 // 5 minutes cache to prevent frequent API calls
    }
  });
  
  const geoHierarchy = useGeoHierarchy();
  
  // Initialize venue filter hook with venues data
  const venueFilter = useVenueFilter({
    venues: venuesHook.venues,
    initialFilters: {
      searchTerm: '',
      tabValue: 0,
      customFilters: {}
    }
  });
  
  // Apply division and city filters using the custom filter functionality
  useEffect(() => {
    if (filterDivision) {
      venueFilter.addFilter('masteredDivisionId', filterDivision);
    } else {
      venueFilter.removeFilter('masteredDivisionId');
    }
  }, [filterDivision, venueFilter.addFilter, venueFilter.removeFilter]);
  
  useEffect(() => {
    if (filterCity) {
      venueFilter.addFilter('masteredCityId', filterCity);
    } else {
      venueFilter.removeFilter('masteredCityId');
    }
  }, [filterCity, venueFilter.addFilter, venueFilter.removeFilter]);
  
  // Clear city filter when division changes
  useEffect(() => {
    if (filterDivision !== '') {
      setFilterCity('');
    }
  }, [filterDivision]);
  
  // Loading state is true if any data is loading
  const loading = venuesHook.loading || 
                 Object.values(geoHierarchy.loading).some(Boolean);
  
  // Filter cities based on selected division
  const filteredCities = filterDivision 
    ? geoHierarchy.cities.filter(city => city.masteredDivisionId === filterDivision)
    : geoHierarchy.cities;
  
  // Function to fetch nearest cities
  const fetchNearestCities = useCallback(async (longitude, latitude) => {
    try {
      const response = await venuesApi.getNearestCity(
        { longitude, latitude },
        currentApp?.id || '1'
      );
      
      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response && response.data) {
        return Array.isArray(response.data) ? response.data : [response.data];
      } else if (response && response._id) {
        return [response];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching nearest cities:', error);
      throw error;
    }
  }, [currentApp?.id]);
  
  // Function to fetch geo hierarchy data
  const fetchGeoHierarchy = useCallback(async () => {
    try {
      // The geo hierarchy hook automatically fetches data as needed
      // We can manually trigger fetches if needed
      await geoHierarchy.fetchCountries();
    } catch (error) {
      console.error('Error fetching geo hierarchy:', error);
      throw error;
    }
  }, [geoHierarchy.fetchCountries]);
  
  // Combine props for the presentation component
  const props = {
    // Venue data
    venues: venuesHook.venues,
    filteredVenues: venueFilter.filteredVenues,
    loading,
    error: venuesHook.error,
    
    // Filters
    searchTerm: venueFilter.searchTerm,
    setSearchTerm: venueFilter.setSearchTerm,
    tabValue: venueFilter.tabValue,
    setTabValue: venueFilter.setTabValue,
    
    // Division and City filters
    filterDivision,
    setFilterDivision,
    filterCity,
    setFilterCity,
    
    // Geo hierarchy data
    countries: geoHierarchy.countries,
    regions: geoHierarchy.regions,
    divisions: geoHierarchy.divisions,
    cities: geoHierarchy.cities,
    filteredCities,
    
    // Geo hierarchy selection
    selectedCountry: geoHierarchy.selectedCountry,
    selectedRegion: geoHierarchy.selectedRegion,
    selectedDivision: geoHierarchy.selectedDivision,
    selectedCity: geoHierarchy.selectedCity,
    
    setSelectedCountry: geoHierarchy.setSelectedCountry,
    setSelectedRegion: geoHierarchy.setSelectedRegion,
    setSelectedDivision: geoHierarchy.setSelectedDivision,
    setSelectedCity: geoHierarchy.setSelectedCity,
    
    // Venue operations - wrap to ensure appId is included
    createVenue: useCallback((venueData) => {
      return venuesHook.createVenue({
        ...venueData,
        appId: currentApp?.id || '1'
      });
    }, [venuesHook.createVenue, currentApp?.id]),
    
    updateVenue: useCallback((venueData) => {
      return venuesHook.updateVenue({
        ...venueData,
        appId: currentApp?.id || '1'
      });
    }, [venuesHook.updateVenue, currentApp?.id]),
    
    deleteVenue: venuesHook.deleteVenue,
    validateVenueGeo: venuesHook.validateVenueGeo,
    batchValidateGeo: venuesHook.batchValidateGeo,
    
    // Other
    pagination: venuesHook.pagination,
    setPagination: venuesHook.setPagination,
    getCityCoordinates: geoHierarchy.getCityCoordinates,
    fetchGeoDataById: geoHierarchy.fetchGeoDataById,
    fetchNearestCities,
    fetchGeoHierarchy
  };

  return <VenuesPage {...props} />;
};

export default VenuesPageContainer;