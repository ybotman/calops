'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '@/lib/AppContext';
import masteredLocationsApi from '@/lib/api-client/mastered-locations';
import axios from 'axios';

/**
 * Custom hook for managing geo hierarchy data (countries, regions, divisions, cities)
 * @param {Object} options - Hook options
 * @param {string} [options.appId] - Application ID (default: from AppContext)
 * @param {Object} [options.initialValues] - Initial selection values
 * @param {string} [options.initialValues.countryId] - Initial country ID
 * @param {string} [options.initialValues.regionId] - Initial region ID
 * @param {string} [options.initialValues.divisionId] - Initial division ID
 * @param {string} [options.initialValues.cityId] - Initial city ID
 * @param {Object} [options.cacheOptions] - Cache configuration
 * @param {number} [options.cacheOptions.maxAge] - Maximum cache age in ms (default: 5 minutes)
 * @returns {Object} Geo hierarchy data and operations
 */
const useGeoHierarchy = (options = {}) => {
  // Get app context for current application
  const { currentApp } = useAppContext();
  
  // Use provided appId or default from context
  const appId = options.appId || currentApp?.id || '1';
  
  // Cache configuration with defaults
  const cacheOptions = {
    maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
    ...(options.cacheOptions || {})
  };
  
  // State for geo data
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [cities, setCities] = useState([]);
  
  // State for selected values
  const [selectedCountry, setSelectedCountry] = useState(options.initialValues?.countryId || null);
  const [selectedRegion, setSelectedRegion] = useState(options.initialValues?.regionId || null);
  const [selectedDivision, setSelectedDivision] = useState(options.initialValues?.divisionId || null);
  const [selectedCity, setSelectedCity] = useState(options.initialValues?.cityId || null);
  
  // State for loading and errors
  const [loading, setLoading] = useState({
    countries: false,
    regions: false,
    divisions: false,
    cities: false
  });
  const [error, setError] = useState(null);
  
  // Cache state
  const [lastUpdated, setLastUpdated] = useState({
    countries: null,
    regions: null,
    divisions: null,
    cities: null
  });

  /**
   * Fetch countries from the API
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @returns {Promise<Array>} Countries array
   */
  const fetchCountries = useCallback(async (forceRefresh = false) => {
    // Skip fetch if we have countries and aren't forcing a refresh
    if (countries.length > 0 && !forceRefresh && lastUpdated.countries) {
      // Only use cached data if it's less than the configured cache age
      const cacheAge = Date.now() - lastUpdated.countries;
      if (cacheAge < cacheOptions.maxAge) {
        return countries;
      }
    }

    try {
      setLoading(prev => ({ ...prev, countries: true }));
      setError(null);
      
      // Fetch countries from API - ensure appId is valid and always use string
      const normalizedAppId = typeof appId === 'object' ? (appId?.id || '1') : (appId || '1');
      
      // Fetch countries from API
      const response = await masteredLocationsApi.getCountries({ 
        appId: normalizedAppId,
        isActive: true 
      });
      
      // Process response
      const countriesData = response?.countries || [];
      
      // Update state
      setCountries(countriesData);
      setLastUpdated(prev => ({ ...prev, countries: Date.now() }));
      
      return countriesData;
    } catch (err) {
      console.error('Error fetching countries:', err);
      setError(err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  }, [appId, cacheOptions.maxAge]);

  /**
   * Fetch regions from the API
   * @param {string} countryId - Country ID to filter by
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @returns {Promise<Array>} Regions array
   */
  const fetchRegions = useCallback(async (countryId, forceRefresh = false) => {
    if (!countryId) {
      setRegions([]);
      return [];
    }
    
    // Skip fetch if we have regions for this country and aren't forcing a refresh
    if (regions.length > 0 && selectedCountry === countryId && !forceRefresh && lastUpdated.regions) {
      // Only use cached data if it's less than the configured cache age
      const cacheAge = Date.now() - lastUpdated.regions;
      if (cacheAge < cacheOptions.maxAge) {
        return regions;
      }
    }

    try {
      setLoading(prev => ({ ...prev, regions: true }));
      setError(null);
      
      // Fetch regions from API
      const response = await masteredLocationsApi.getRegions({
        appId,
        countryId,
        isActive: true
      });
      
      // Process response
      const regionsData = response?.regions || [];
      
      // Update state
      setRegions(regionsData);
      setLastUpdated(prev => ({ ...prev, regions: Date.now() }));
      
      return regionsData;
    } catch (err) {
      console.error('Error fetching regions:', err);
      setError(err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, regions: false }));
    }
  }, [appId, selectedCountry, cacheOptions.maxAge]);

  /**
   * Fetch divisions from the API
   * @param {string} regionId - Region ID to filter by
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @returns {Promise<Array>} Divisions array
   */
  const fetchDivisions = useCallback(async (regionId, forceRefresh = false) => {
    if (!regionId) {
      setDivisions([]);
      return [];
    }
    
    // Skip fetch if we have divisions for this region and aren't forcing a refresh
    if (divisions.length > 0 && selectedRegion === regionId && !forceRefresh && lastUpdated.divisions) {
      // Only use cached data if it's less than the configured cache age
      const cacheAge = Date.now() - lastUpdated.divisions;
      if (cacheAge < cacheOptions.maxAge) {
        return divisions;
      }
    }

    try {
      setLoading(prev => ({ ...prev, divisions: true }));
      setError(null);
      
      // Fetch divisions from API
      const response = await masteredLocationsApi.getDivisions({
        appId,
        regionId,
        isActive: true
      });
      
      // Process response
      const divisionsData = response?.divisions || [];
      
      // Update state
      setDivisions(divisionsData);
      setLastUpdated(prev => ({ ...prev, divisions: Date.now() }));
      
      return divisionsData;
    } catch (err) {
      console.error('Error fetching divisions:', err);
      setError(err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, divisions: false }));
    }
  }, [appId, selectedRegion, cacheOptions.maxAge]);

  /**
   * Fetch cities from the API
   * @param {string} divisionId - Division ID to filter by
   * @param {boolean} [forceRefresh=false] - Force a refresh ignoring cache
   * @returns {Promise<Array>} Cities array
   */
  const fetchCities = useCallback(async (divisionId, forceRefresh = false) => {
    if (!divisionId) {
      setCities([]);
      return [];
    }
    
    // Skip fetch if we have cities for this division and aren't forcing a refresh
    if (cities.length > 0 && selectedDivision === divisionId && !forceRefresh && lastUpdated.cities) {
      // Only use cached data if it's less than the configured cache age
      const cacheAge = Date.now() - lastUpdated.cities;
      if (cacheAge < cacheOptions.maxAge) {
        return cities;
      }
    }

    try {
      setLoading(prev => ({ ...prev, cities: true }));
      setError(null);
      
      // Fetch cities from API
      const response = await masteredLocationsApi.getCities({
        appId,
        divisionId,
        isActive: true
      });
      
      // Process response
      const citiesData = response?.cities || [];
      
      // Update state
      setCities(citiesData);
      setLastUpdated(prev => ({ ...prev, cities: Date.now() }));
      
      return citiesData;
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError(err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  }, [appId, selectedDivision, cacheOptions.maxAge]);

  /**
   * Fetch geo data by entity ID (gets all parent data too)
   * @param {Object} params - Entity parameters
   * @param {string} [params.cityId] - City ID to load
   * @param {string} [params.divisionId] - Division ID to load
   * @param {string} [params.regionId] - Region ID to load
   * @param {string} [params.countryId] - Country ID to load
   * @returns {Promise<Object>} Selected geo data
   */
  const fetchGeoDataById = useCallback(async (params = {}) => {
    try {
      setLoading(prev => ({ ...prev, countries: true }));
      setError(null);
      
      // Start with countries
      const countriesData = await fetchCountries();
      
      // If we have a country ID or need to find one, process countries
      if (params.countryId || params.regionId || params.divisionId || params.cityId) {
        let countryId = params.countryId;
        
        // If we have a city, division, or region ID but no country ID, we need to find it
        if (!countryId && (params.cityId || params.divisionId || params.regionId)) {
          // Fetch the needed entity to get its parent IDs
          let parentResponse;
          if (params.cityId) {
            parentResponse = await axios.get(`/api/masteredLocations/cities/${params.cityId}?appId=${appId}`);
          } else if (params.divisionId) {
            parentResponse = await axios.get(`/api/masteredLocations/divisions/${params.divisionId}?appId=${appId}`);
          } else if (params.regionId) {
            parentResponse = await axios.get(`/api/masteredLocations/regions/${params.regionId}?appId=${appId}`);
          }
          
          // Extract parent IDs from response
          if (parentResponse && parentResponse.data) {
            countryId = parentResponse.data.countryId;
            if (!params.regionId && parentResponse.data.regionId) {
              params.regionId = parentResponse.data.regionId;
            }
            if (!params.divisionId && parentResponse.data.divisionId) {
              params.divisionId = parentResponse.data.divisionId;
            }
          }
        }
        
        if (countryId) {
          setSelectedCountry(countryId);
          
          // Fetch regions for this country
          setLoading(prev => ({ ...prev, regions: true }));
          const regionsData = await fetchRegions(countryId);
          
          if (params.regionId) {
            setSelectedRegion(params.regionId);
            
            // Fetch divisions for this region
            setLoading(prev => ({ ...prev, divisions: true }));
            const divisionsData = await fetchDivisions(params.regionId);
            
            if (params.divisionId) {
              setSelectedDivision(params.divisionId);
              
              // Fetch cities for this division
              setLoading(prev => ({ ...prev, cities: true }));
              const citiesData = await fetchCities(params.divisionId);
              
              if (params.cityId) {
                setSelectedCity(params.cityId);
              }
            }
          }
        }
      }
      
      return {
        countryId: selectedCountry,
        regionId: selectedRegion,
        divisionId: selectedDivision,
        cityId: selectedCity
      };
    } catch (err) {
      console.error('Error fetching geo data by ID:', err);
      setError(err);
      return {};
    } finally {
      setLoading({
        countries: false,
        regions: false,
        divisions: false,
        cities: false
      });
    }
  }, [appId, fetchCountries, fetchRegions, fetchDivisions, fetchCities, selectedCountry, selectedRegion, selectedDivision, selectedCity]);

  // Fetch countries when the hook is first mounted
  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Fetch regions when the selected country changes
  useEffect(() => {
    if (selectedCountry) {
      fetchRegions(selectedCountry);
      
      // Clear selections down the hierarchy only if we're changing country
      // This prevents infinite loops from state changes
      if (regions.length > 0) {
        setSelectedRegion(null);
        setSelectedDivision(null);
        setSelectedCity(null);
        setDivisions([]);
        setCities([]);
      }
    } else {
      setRegions([]);
      setSelectedRegion(null);
      setSelectedDivision(null);
      setSelectedCity(null);
      setDivisions([]);
      setCities([]);
    }
  }, [selectedCountry, fetchRegions]);

  // Fetch divisions when the selected region changes
  useEffect(() => {
    if (selectedRegion) {
      fetchDivisions(selectedRegion);
      
      // Clear selections down the hierarchy only if we're changing region
      // This prevents infinite loops from state changes
      if (divisions.length > 0) {
        setSelectedDivision(null);
        setSelectedCity(null);
        setCities([]);
      }
    } else {
      setDivisions([]);
      setSelectedDivision(null);
      setSelectedCity(null);
      setCities([]);
    }
  }, [selectedRegion, fetchDivisions]);

  // Fetch cities when the selected division changes
  useEffect(() => {
    if (selectedDivision) {
      fetchCities(selectedDivision);
      
      // Clear city selection only if we're changing division and had cities before
      // This prevents infinite loops from state changes
      if (cities.length > 0) {
        setSelectedCity(null);
      }
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedDivision, fetchCities]);

  /**
   * Get coordinates for a city
   * @param {string} cityId - City ID
   * @returns {Promise<Array>} Coordinates [lng, lat]
   */
  const getCityCoordinates = useCallback(async (cityId) => {
    if (!cityId) return null;
    
    try {
      const response = await axios.get(`/api/masteredLocations/cities/${cityId}?appId=${appId}`);
      
      if (response.data && response.data.coordinates) {
        return response.data.coordinates;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching city coordinates:', err);
      return null;
    }
  }, [appId]);

  // Memoize the public API to prevent unnecessary re-renders
  const api = useMemo(() => ({
    // Data
    countries,
    regions,
    divisions,
    cities,
    
    // Selected values
    selectedCountry,
    selectedRegion,
    selectedDivision,
    selectedCity,
    
    // Setters
    setSelectedCountry,
    setSelectedRegion,
    setSelectedDivision,
    setSelectedCity,
    
    // Loading and error state
    loading,
    error,
    
    // Operations
    fetchCountries,
    fetchRegions,
    fetchDivisions,
    fetchCities,
    fetchGeoDataById,
    getCityCoordinates,
    
    // Reset
    reset: () => {
      setSelectedCountry(null);
      setSelectedRegion(null);
      setSelectedDivision(null);
      setSelectedCity(null);
    }
  }), [
    countries,
    regions,
    divisions,
    cities,
    selectedCountry,
    selectedRegion,
    selectedDivision,
    selectedCity,
    loading,
    error,
    fetchCountries,
    fetchRegions,
    fetchDivisions,
    fetchCities,
    fetchGeoDataById,
    getCityCoordinates
  ]);

  return api;
};

export default useGeoHierarchy;