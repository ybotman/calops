'use client';

import React from 'react';
import VenuesPage from './VenuesPage';
import { 
  useVenues, 
  useGeoHierarchy,
  useVenueFilter
} from './hooks';

/**
 * VenuesPageContainer component
 * Container component that manages state and data fetching for the VenuesPage
 */
const VenuesPageContainer = () => {
  // Use the hooks to fetch and manage data
  const venuesHook = useVenues();
  const geoHierarchy = useGeoHierarchy();
  
  // Initialize venue filter hook with venues data
  const venueFilter = useVenueFilter({
    venues: venuesHook.venues,
    initialFilters: {
      searchTerm: '',
      tabValue: 0
    }
  });
  
  // Loading state is true if any data is loading
  const loading = venuesHook.loading || 
                 Object.values(geoHierarchy.loading).some(Boolean);
  
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
    
    // Geo hierarchy data
    countries: geoHierarchy.countries,
    regions: geoHierarchy.regions,
    divisions: geoHierarchy.divisions,
    cities: geoHierarchy.cities,
    
    // Geo hierarchy selection
    selectedCountry: geoHierarchy.selectedCountry,
    selectedRegion: geoHierarchy.selectedRegion,
    selectedDivision: geoHierarchy.selectedDivision,
    selectedCity: geoHierarchy.selectedCity,
    
    setSelectedCountry: geoHierarchy.setSelectedCountry,
    setSelectedRegion: geoHierarchy.setSelectedRegion,
    setSelectedDivision: geoHierarchy.setSelectedDivision,
    setSelectedCity: geoHierarchy.setSelectedCity,
    
    // Venue operations
    createVenue: venuesHook.createVenue,
    updateVenue: venuesHook.updateVenue,
    deleteVenue: venuesHook.deleteVenue,
    validateVenueGeo: venuesHook.validateVenueGeo,
    batchValidateGeo: venuesHook.batchValidateGeo,
    
    // Other
    pagination: venuesHook.pagination,
    setPagination: venuesHook.setPagination,
    getCityCoordinates: geoHierarchy.getCityCoordinates,
    fetchGeoDataById: geoHierarchy.fetchGeoDataById
  };

  return <VenuesPage {...props} />;
};

export default VenuesPageContainer;