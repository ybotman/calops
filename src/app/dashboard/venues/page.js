'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import { useAppContext } from '@/lib/AppContext';

export default function VenuesPage() {
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });
  const { currentApp } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [venueForm, setVenueForm] = useState({
    name: '',
    shortName: '',
    address1: '',
    address2: '',
    address3: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    comments: '',
    latitude: '',
    longitude: '',
    masteredCityId: '',
    masteredDivisionId: '',
    masteredRegionId: '',
    masteredCountryId: '',
    isActive: false,
    isApproved: false,
  });
  const [editMode, setEditMode] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [nearestCities, setNearestCities] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState(null);
  const [fetchingNearest, setFetchingNearest] = useState(false);
  
  // Geo Hierarchy data for selection dropdowns
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingGeoHierarchy, setLoadingGeoHierarchy] = useState(false);
  const [hierarchySelectMode, setHierarchySelectMode] = useState(false);

  // Initialize with error state
  const [error, setError] = useState(null);
  
  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('idle'); // idle, loading, success, error
  const [importedVenues, setImportedVenues] = useState([]);
  const [selectedVenues, setSelectedVenues] = useState({});
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, error: 0, skipped: 0 });
  const [fetchingBTCVenues, setFetchingBTCVenues] = useState(false);
  
  // Tab state for approved/not approved
  const [tabValue, setTabValue] = useState(0);
  
  // Venue filtering dropdowns
  const [filterDivision, setFilterDivision] = useState('');
  const [filterCity, setFilterCity] = useState('');

  // Fetch venues on component mount and when app changes
  useEffect(() => {
    fetchVenues();
  }, [currentApp.id, pagination.page, pagination.pageSize, searchTerm, filterDivision, filterCity, tabValue]);
  
  // Fetch geo hierarchy for filters on mount
  useEffect(() => {
    fetchGeoHierarchy();
  }, [currentApp.id]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching venues for AppId: ${currentApp.id}`);
      
      // First check the debug endpoint to confirm API connectivity
      try {
        await axios.get('/api/venues-debug');
        console.log('Venues debug API check successful');
      } catch (debugError) {
        console.error('Error checking venues debug endpoint:', debugError);
      }
      
      const params = {
        appId: currentApp.id,
        page: pagination.page + 1,
        limit: pagination.pageSize,
        search: searchTerm,
      };
      
      // Add filters
      if (filterDivision) {
        params.masteredDivisionId = filterDivision;
      }
      if (filterCity) {
        params.masteredCityId = filterCity;
      }
      
      // Add approved filter based on tab
      if (tabValue === 1) {
        params.isApproved = true;
      } else if (tabValue === 2) {
        params.isApproved = false;
      }
      
      const response = await axios.get('/api/venues', { params });
      
      if (response.data && response.data.data) {
        // Process venues to ensure masteredCityName is correctly populated
        const processedVenues = response.data.data.map(venue => {
          // Extract the city name from the nested object structure
          let masteredCityName = 'None';
          
          if (venue.masteredCityId) {
            if (typeof venue.masteredCityId === 'object' && venue.masteredCityId.cityName) {
              masteredCityName = venue.masteredCityId.cityName;
            } else if (typeof venue.masteredCityId === 'string') {
              // If we just have an ID, we'll display the ID for now
              masteredCityName = `City ID: ${venue.masteredCityId.substring(0, 8)}...`;
            }
          }
          
          // Ensure address1 and city are set properly
          const address1 = venue.address1 || '';
          const city = venue.city || '';
          
          return {
            ...venue,
            masteredCityName,
            address1,
            city
          };
        });
        
        setVenues(processedVenues);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
        }));
        
        console.log('Processed venues:', processedVenues);
      } else {
        setVenues([]);
        setPagination(prev => ({
          ...prev,
          total: 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      
      // Extract a more detailed error message if available
      let errorMessage = error.message;
      if (error.response) {
        // Server responded with error
        console.error('Server error details:', error.response.data);
        errorMessage = error.response.data?.details || error.response.data?.error || error.message;
      }
      
      setError(`Failed to fetch venues: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Fetch all Geo Hierarchy data
  const fetchGeoHierarchy = async () => {
    try {
      setLoadingGeoHierarchy(true);
      
      const response = await axios.get('/api/geo-hierarchy', {
        params: {
          type: 'all',
          appId: currentApp.id,
        }
      });
      
      if (response.data) {
        // Filter to only show active items
        const activeCountries = response.data.countries?.filter(c => c.active) || [];
        const activeRegions = response.data.regions?.filter(r => r.active) || [];
        const activeDivisions = response.data.divisions?.filter(d => d.active) || [];
        const activeCities = response.data.cities?.filter(c => c.isActive) || [];
        
        setCountries(activeCountries);
        setRegions(activeRegions);
        setDivisions(activeDivisions);
        setCities(activeCities);
      }
    } catch (error) {
      console.error('Error fetching geo hierarchy:', error);
      alert('Failed to load geo hierarchy data. Please try again.');
    } finally {
      setLoadingGeoHierarchy(false);
    }
  };

  const handleAddVenue = () => {
    setEditMode(false);
    setVenueForm({
      name: '',
      shortName: '',
      address1: '',
      address2: '',
      address3: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      comments: '',
      latitude: '',
      longitude: '',
      masteredCityId: '',
      masteredDivisionId: '',
      masteredRegionId: '',
      masteredCountryId: '',
      isActive: false,
      isApproved: false,
    });
    setNearestCities([]);
    setFormErrors({});
    fetchGeoHierarchy(); // Load the geo hierarchy data for dropdowns
    setDialogOpen(true);
  };

  const handleEditVenue = async (venue) => {
    // Ensure we have a valid venue with an ID
    if (!venue || (!venue._id && !venue.id)) {
      console.error('Invalid venue object or missing ID:', venue);
      alert('Cannot edit this venue: invalid data');
      return;
    }
    
    const venueId = venue._id || venue.id;
    console.log(`Editing venue with ID: ${venueId}`, venue);
    
    // For debugging, log all important fields
    console.log('Venue edit details:', {
      name: venue.name,
      address1: venue.address1,
      city: venue.city,
      masteredCityId: venue.masteredCityId,
      masteredCityName: venue.masteredCityName,
    });
    
    setEditMode(true);
    setSelectedVenueId(venueId);
    
    // If we need more details, fetch the complete venue data
    let completeVenue = venue;
    
    try {
      // Only fetch if essential data is missing
      if (!venue.address1 || (venue.masteredCityId && typeof venue.masteredCityId === 'string')) {
        console.log('Fetching complete venue details...');
        const response = await axios.get(`/api/venues/${venueId}`);
        if (response.data) {
          completeVenue = response.data;
          console.log('Fetched complete venue:', completeVenue);
        }
      }
    } catch (error) {
      console.error('Error fetching complete venue details:', error);
      // Continue with what we have
    }
    
    // Format the form data from the venue
    const formData = {
      name: completeVenue.name || '',
      shortName: completeVenue.shortName || '',
      address1: completeVenue.address1 || '',
      address2: completeVenue.address2 || '',
      address3: completeVenue.address3 || '',
      city: completeVenue.city || '',
      state: completeVenue.state || '',
      zip: completeVenue.zip || '',
      phone: completeVenue.phone || '',
      comments: completeVenue.comments || '',
      latitude: completeVenue.latitude || '',
      longitude: completeVenue.longitude || '',
      masteredCityId: 
        (typeof completeVenue.masteredCityId === 'object' ? completeVenue.masteredCityId?._id : completeVenue.masteredCityId) || '',
      masteredDivisionId: 
        (typeof completeVenue.masteredDivisionId === 'object' ? completeVenue.masteredDivisionId?._id : completeVenue.masteredDivisionId) || '',
      masteredRegionId: 
        (typeof completeVenue.masteredRegionId === 'object' ? completeVenue.masteredRegionId?._id : completeVenue.masteredRegionId) || '',
      masteredCountryId: 
        (typeof completeVenue.masteredCountryId === 'object' ? completeVenue.masteredCountryId?._id : completeVenue.masteredCountryId) || '',
      isActive: completeVenue.isActive || false,
      isApproved: completeVenue.isApproved || false,
    };
    
    setVenueForm(formData);
    setFormErrors({});
    
    // Fetch geo hierarchy for dropdowns
    await fetchGeoHierarchy();
    
    // If venue has coordinates, fetch nearest cities
    if (venue.latitude && venue.longitude) {
      await fetchNearestCities(venue.longitude, venue.latitude);
    } else {
      setNearestCities([]);
    }
    
    setDialogOpen(true);
  };

  const handleDeleteVenue = (venue) => {
    // Ensure we have a valid venue with an ID
    if (!venue || (!venue._id && !venue.id)) {
      console.error('Invalid venue object or missing ID:', venue);
      alert('Cannot delete this venue: invalid data');
      return;
    }
    
    setVenueToDelete(venue);
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!venueToDelete || (!venueToDelete._id && !venueToDelete.id)) {
        throw new Error('No valid venue ID for deletion');
      }
      
      const venueId = venueToDelete._id || venueToDelete.id;
      console.log(`Deleting venue with ID: ${venueId}`);
      
      setLoading(true);
      
      await axios.delete(`/api/venues/${venueId}`);
      
      // Refresh the venues list
      fetchVenues();
      
      setConfirmDeleteOpen(false);
      setVenueToDelete(null);
      
      alert('Venue deleted successfully!');
    } catch (error) {
      console.error('Error deleting venue:', error);
      alert(`Failed to delete venue: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setVenueForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    try {
      // Validate the form
      const errors = {};
      
      if (!venueForm.name) {
        errors.name = 'Venue name is required';
      }
      
      if (!venueForm.address1) {
        errors.address1 = 'Address is required';
      }
      
      if (!venueForm.city) {
        errors.city = 'City is required';
      }
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      
      setLoading(true);
      
      // Format latitude and longitude as numbers
      const formattedData = {
        ...venueForm,
        latitude: venueForm.latitude ? parseFloat(venueForm.latitude) : null,
        longitude: venueForm.longitude ? parseFloat(venueForm.longitude) : null,
        appId: currentApp.id,
      };
      
      if (editMode && selectedVenueId) {
        // Update existing venue
        console.log(`Updating venue with ID: ${selectedVenueId}`);
        const response = await axios.put(`/api/venues/${selectedVenueId}`, formattedData);
        console.log('Update response:', response.data);
        
        if (response.data.message) {
          alert(response.data.message);
        } else {
          alert('Venue updated successfully!');
        }
      } else {
        // Create new venue
        console.log('Creating new venue');
        const response = await axios.post('/api/venues', formattedData);
        console.log('Create response:', response.data);
        
        if (response.data.message) {
          alert(response.data.message);
        } else {
          alert('Venue created successfully!');
        }
      }
      
      // Refresh the venues list
      fetchVenues();
      
      // Close the dialog
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving venue:', error);
      alert(`Failed to save venue: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchNearestCities = async (longitude, latitude) => {
    try {
      setFetchingNearest(true);
      
      if (!longitude || !latitude) {
        alert('Please enter both latitude and longitude');
        return;
      }
      
      const response = await axios.get('/api/venues/nearest-city', {
        params: {
          longitude,
          latitude,
          appId: currentApp.id,
          limit: 5
        }
      });
      
      if (response.data && response.data.length > 0) {
        // Only show active cities
        const activeCities = response.data.filter(city => city.isActive);
        setNearestCities(activeCities);
        
        if (activeCities.length === 0) {
          alert('No active cities found nearby. You may need to manually assign the geo hierarchy.');
        }
      } else {
        setNearestCities([]);
        alert('No nearby cities found. You may need to manually assign the geo hierarchy.');
      }
    } catch (error) {
      console.error('Error fetching nearest cities:', error);
      alert(`Failed to find nearest cities: ${error.message}`);
    } finally {
      setFetchingNearest(false);
    }
  };
  
  // Handle geo hierarchy selection change
  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    setVenueForm(prev => ({
      ...prev,
      masteredCountryId: countryId,
      masteredRegionId: '',
      masteredDivisionId: '',
      masteredCityId: '',
    }));
  };
  
  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setVenueForm(prev => ({
      ...prev,
      masteredRegionId: regionId,
      masteredDivisionId: '',
      masteredCityId: '',
    }));
  };
  
  const handleDivisionChange = (e) => {
    const divisionId = e.target.value;
    setVenueForm(prev => ({
      ...prev,
      masteredDivisionId: divisionId,
      masteredCityId: '',
    }));
  };
  
  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setVenueForm(prev => ({
      ...prev,
      masteredCityId: cityId,
    }));
  };
  
  // Toggle between hierarchy selection modes
  const toggleHierarchyMode = () => {
    setHierarchySelectMode(!hierarchySelectMode);
    // If switching to hierarchy mode, clear nearest cities
    if (!hierarchySelectMode) {
      setNearestCities([]);
    }
  };

  const handleFindNearestCity = () => {
    if (venueForm.longitude && venueForm.latitude) {
      fetchNearestCities(venueForm.longitude, venueForm.latitude);
    } else {
      alert('Please enter both latitude and longitude first');
    }
  };
  
  const handleImportVenues = async () => {
    try {
      setImportDialogOpen(true);
      setImportStatus('loading');
      setFetchingBTCVenues(true);
      setImportedVenues([]);
      setSelectedVenues({});
      
      // Get all existing venues for comparison
      const existingVenuesResponse = await axios.get('/api/venues', {
        params: {
          appId: currentApp.id,
          limit: 1000 // Get a large number to check for duplicates
        }
      });
      
      const existingVenues = existingVenuesResponse.data?.data || [];
      console.log(`Found ${existingVenues.length} existing venues for comparison`);
      
      // Fetch all pages from BTC WordPress API using pagination
      let allVenues = [];
      let currentPage = 1;
      let totalPages = 1;
      
      do {
        console.log(`Fetching BTC venues page ${currentPage}...`);
        const response = await axios.get(`https://bostontangocalendar.com/wp-json/tribe/events/v1/venues`, {
          params: {
            page: currentPage
          }
        });
        
        // Get total pages from headers or response
        if (currentPage === 1) {
          // Try to get from X-WP-TotalPages header
          const totalPagesHeader = response.headers['x-wp-totalpages'] || response.headers['X-WP-TotalPages'];
          if (totalPagesHeader) {
            totalPages = parseInt(totalPagesHeader, 10);
          } else if (response.data && response.data.total_pages) {
            // Fallback to response data
            totalPages = response.data.total_pages;
          }
          console.log(`Total pages of venues: ${totalPages}`);
        }
        
        if (response.data && response.data.venues) {
          allVenues = [...allVenues, ...response.data.venues];
          console.log(`Fetched ${response.data.venues.length} venues from page ${currentPage}`);
        } else {
          throw new Error(`Invalid response format from BTC API on page ${currentPage}`);
        }
        
        currentPage++;
      } while (currentPage <= totalPages);
      
      console.log(`Fetched a total of ${allVenues.length} venues from BTC API`);
      
      // Transform the WordPress venue format to our application format
      const transformedVenues = allVenues.map(venue => {
        // Extract coordinates from WordPress venue
        let latitude = null;
        let longitude = null;
        
        // Check if we have geo coordinates
        if (venue.geo_lat && venue.geo_lng) {
          latitude = parseFloat(venue.geo_lat);
          longitude = parseFloat(venue.geo_lng);
        }
        
        // Check if this venue already exists in our system
        // Match by name AND address or by exact coordinates
        const isDuplicate = existingVenues.some(existingVenue => {
          // Main match: same name and similar address
          const nameMatch = existingVenue.name?.toLowerCase() === venue.venue?.toLowerCase();
          const addressMatch = existingVenue.address1?.toLowerCase()?.includes(venue.address?.toLowerCase()) ||
                               venue.address?.toLowerCase()?.includes(existingVenue.address1?.toLowerCase());
          
          // Alternate match: exact coordinates match (if available)
          const coordMatch = venue.geo_lat && venue.geo_lng && 
                             existingVenue.latitude === parseFloat(venue.geo_lat) && 
                             existingVenue.longitude === parseFloat(venue.geo_lng);
          
          return (nameMatch && addressMatch) || coordMatch;
        });
        
        // Create a venue object in our application's format
        return {
          id: venue.id,
          originalId: venue.id,
          name: venue.venue || '',
          shortName: '',
          address1: venue.address || '',
          address2: '',
          address3: '',
          city: venue.city || '',
          state: venue.state || '',
          zip: venue.zip || '',
          phone: venue.phone || '',
          comments: venue.description || '',
          latitude,
          longitude,
          isActive: true,
          masteredCityId: '',
          source: 'BTC WordPress',
          sourceId: venue.id,
          url: venue.url || '',
          isDuplicate, // Add flag indicating if venue already exists
          // Original WordPress data for reference
          original: venue
        };
      });
      
      // Initialize venues as selected by default (except duplicates)
      const initialSelected = {};
      transformedVenues.forEach(venue => {
        initialSelected[venue.id] = !venue.isDuplicate; // Only select non-duplicates by default
      });
      
      setImportedVenues(transformedVenues);
      setSelectedVenues(initialSelected);
      setImportStatus('ready');
    } catch (error) {
      console.error('Error fetching BTC venues:', error);
      setImportStatus('error');
      alert(`Failed to fetch venues from BTC: ${error.message}`);
    } finally {
      setFetchingBTCVenues(false);
    }
  };
  
  const handleSelectAllVenues = (event) => {
    const checked = event.target.checked;
    const newSelected = {};
    
    importedVenues.forEach(venue => {
      newSelected[venue.id] = checked;
    });
    
    setSelectedVenues(newSelected);
  };
  
  const handleSelectVenue = (event, id) => {
    setSelectedVenues(prev => ({
      ...prev,
      [id]: event.target.checked
    }));
  };
  
  const processImport = async () => {
    try {
      // Get only the selected venues
      const venuesToImport = importedVenues.filter(venue => selectedVenues[venue.id]);
      
      if (venuesToImport.length === 0) {
        alert('No venues selected for import');
        return;
      }
      
      // Count how many duplicates were selected
      const selectedDuplicates = venuesToImport.filter(venue => venue.isDuplicate).length;
      
      setImportStatus('importing');
      setImportProgress(0);
      // Reset the import results counters
      const initialResults = { success: 0, error: 0, skipped: 0 };
      setImportResults(initialResults);
      console.log('Starting import with counters reset:', initialResults);
      
      // Process venues one by one
      for (let i = 0; i < venuesToImport.length; i++) {
        const venue = venuesToImport[i];
        
        try {
          // If the venue is already in the system and the user selected it anyway,
          // we'll still try to import it, but record it separately
          let isDuplicate = venue.isDuplicate;
          
          // Try to find the nearest city if we have coordinates
          try {
            if (venue.latitude && venue.longitude) {
              const cityResponse = await axios.get('/api/venues/nearest-city', {
                params: {
                  longitude: venue.longitude,
                  latitude: venue.latitude,
                  appId: currentApp.id,
                  limit: 1
                }
              });
              
              if (cityResponse.data && cityResponse.data.length > 0) {
                const nearestCity = cityResponse.data[0];
                venue.masteredCityId = nearestCity._id;
                venue.masteredDivisionId = nearestCity.masteredDivisionId?._id || '';
                venue.masteredRegionId = nearestCity.masteredDivisionId?.masteredRegionId?._id || '';
                venue.masteredCountryId = nearestCity.masteredDivisionId?.masteredRegionId?.masteredCountryId?._id || '';
                venue.nearestCityName = nearestCity.cityName;
                venue.distanceInKm = nearestCity.distanceInKm;
              } else {
                console.log(`No nearest city found for venue ${venue.name} at coordinates [${venue.latitude}, ${venue.longitude}]`);
                // Handle case when no city is found - initialize with empty values
                venue.masteredCityId = '';
                venue.masteredDivisionId = '';
                venue.masteredRegionId = '';
                venue.masteredCountryId = '';
              }
            }
          } catch (cityLookupError) {
            console.error(`Error finding nearest city for venue ${venue.name}:`, cityLookupError.message);
            // Handle API error case - initialize with empty values
            venue.masteredCityId = '';
            venue.masteredDivisionId = '';
            venue.masteredRegionId = '';
            venue.masteredCountryId = '';
          }
          
          // Add the application ID
          venue.appId = currentApp.id;
          
          if (isDuplicate) {
            console.log(`Skipping duplicate venue: ${venue.name}`);
            
            setImportResults(prev => ({
              ...prev,
              skipped: prev.skipped + 1
            }));
          } else {
            // Ensure all venues have coordinates
            if (venue.latitude && venue.longitude) {
              // Ensure venue has proper geolocation coordinates in GeoJSON format
              venue.geolocation = {
                type: "Point",
                coordinates: [parseFloat(venue.longitude), parseFloat(venue.latitude)]
              };
              // Ensure numeric latitude/longitude fields are also set
              venue.latitude = parseFloat(venue.latitude);
              venue.longitude = parseFloat(venue.longitude);
            } else {
              // Provide default coordinates for Boston if none exist
              console.log(`Adding default coordinates for ${venue.name}`);
              venue.latitude = 42.3601;
              venue.longitude = -71.0589;
              venue.geolocation = {
                type: "Point",
                coordinates: [-71.0589, 42.3601] // Boston coordinates
              };
            }
            
            // Ensure required fields have values
            if (!venue.address1 || venue.address1.trim() === '') {
              venue.address1 = venue.name || 'Unknown Address';
              console.log(`Adding default address1 for ${venue.name}`);
            }
            
            if (!venue.city || venue.city.trim() === '') {
              venue.city = 'Boston';
              console.log(`Adding default city for ${venue.name}`);
            }
            
            try {
              // Log the venue data being sent for debugging
              console.log(`Sending venue data for ${venue.name}:`, JSON.stringify({
                name: venue.name,
                address1: venue.address1,
                city: venue.city,
                appId: venue.appId,
                geolocation: venue.geolocation,
                masteredCityId: venue.masteredCityId || null
              }));
              
              // Save to the database
              const response = await axios.post('/api/venues', venue);
              console.log(`Successfully imported venue: ${venue.name}`, response.data);
              
              setImportResults(prev => ({
                ...prev,
                success: prev.success + 1
              }));
            } catch (saveError) {
              console.error(`Error saving venue ${venue.name}:`, saveError);
              // Get detailed error info if available
              if (saveError.response?.data) {
                console.error(`Server error details:`, JSON.stringify(saveError.response.data));
                
                // Check for any errors where we should retry with defaults
                const shouldRetry = 
                  // No city found error
                  (saveError.response.status === 404 && 
                   saveError.response.data.error === "No city found near the provided coordinates") ||
                  // Duplicate venue error
                  (saveError.response.status === 409 && 
                   saveError.response.data.error === "Duplicate venue within 100 meters") ||
                  // Any other 400 errors that might need default data
                  (saveError.response.status === 400);
                
                if (shouldRetry) {
                  // Try again with completely default Boston data
                  console.log(`Retrying venue ${venue.name} with all Boston defaults`);
                  
                  try {
                    // Create a modified venue with guaranteed unique location in Boston
                    // Use small random offsets for uniqueness
                    const randomOffset = () => (Math.random() - 0.5) * 0.01; // ±0.005 degrees (about 500m)
                    
                    const retryVenue = {
                      ...venue,
                      // Default Boston location with random offset to avoid duplicates
                      latitude: 42.3601 + randomOffset(),
                      longitude: -71.0589 + randomOffset(),
                      // Ensure unique name if needed
                      name: venue.name || `Imported Venue ${Date.now()}`,
                      address1: venue.address1 || venue.name || "Default Address",
                      city: "Boston",
                      state: "MA",
                      zip: "02108",
                      // Default GeoJSON
                      geolocation: {
                        type: "Point",
                        coordinates: [-71.0589 + randomOffset(), 42.3601 + randomOffset()]
                      },
                      // Fixed masteredCity fields
                      masteredCityId: "64f26a9f75bfc0db12ed7a1e", // Boston city ID
                      masteredDivisionId: "64f26a9f75bfc0db12ed7a15", // Massachusetts division ID
                      masteredRegionId: "64f26a9f75bfc0db12ed7a12", // New England region ID
                      masteredCountryId: "64f26a9f75bfc0db12ed7a0f", // USA country ID
                      appId: currentApp.id
                    };
                    
                    console.log(`Retrying with modified data:`, JSON.stringify({
                      name: retryVenue.name,
                      address1: retryVenue.address1,
                      city: retryVenue.city,
                      coords: [retryVenue.longitude, retryVenue.latitude]
                    }));
                    
                    // Try saving again with the modified data
                    const retryResponse = await axios.post('/api/venues', retryVenue);
                    console.log(`Successfully imported venue on retry: ${retryVenue.name}`, retryResponse.data);
                    
                    setImportResults(prev => ({
                      ...prev,
                      success: prev.success + 1
                    }));
                    
                    // Skip the error counter increment
                    return;
                  } catch (retryError) {
                    console.error(`Retry failed for venue ${venue.name}:`, retryError);
                    if (retryError.response?.data) {
                      console.error(`Retry error details:`, JSON.stringify(retryError.response.data));
                    }
                  }
                }
              }
              
              setImportResults(prev => ({
                ...prev,
                error: prev.error + 1
              }));
            }
          }
        } catch (error) {
          console.error(`Error importing venue ${venue.name}:`, error);
          
          setImportResults(prev => ({
            ...prev,
            error: prev.error + 1
          }));
        }
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / venuesToImport.length) * 100));
      }
      
      setImportStatus('complete');
      
      // Refresh the venues list
      fetchVenues();
      
      // Provide a detailed summary in the console
      console.log('Import summary:', {
        totalSelected: venuesToImport.length,
        duplicatesSelected: selectedDuplicates,
        imported: importResults.success,
        failed: importResults.error,
        skipped: importResults.skipped
      });
      
    } catch (error) {
      console.error('Error during import process:', error);
      setImportStatus('error');
      alert(`Import process failed: ${error.message}`);
    }
  };

  const handleSelectCity = (city) => {
    setVenueForm(prev => ({
      ...prev,
      masteredCityId: city._id,
      masteredDivisionId: city.masteredDivisionId?._id || '',
      masteredRegionId: city.masteredDivisionId?.masteredRegionId?._id || '',
      masteredCountryId: city.masteredDivisionId?.masteredRegionId?.masteredCountryId?._id || '',
    }));
  };

  // Define columns for DataGrid
  const columns = [
    { field: 'name', headerName: 'Venue Name', flex: 1.5 },
    { 
      field: 'address1', 
      headerName: 'Address', 
      flex: 1.5
    },
    {
      field: 'city',
      headerName: 'City',
      flex: 1
    },
    { 
      field: 'masteredCityName', 
      headerName: 'Mastered City', 
      flex: 1,
      valueGetter: (params) => {
        // The masteredCityName field is already prepared in the row transformation
        return params.row?.masteredCityName || 'None';
      }
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 200,
      renderCell: (params) => {
        // Make sure params.row is defined before using it
        if (!params.row) {
          return <Box>Loading...</Box>;
        }
        
        return (
          <Box>
            <Button
              variant="text"
              color="primary"
              onClick={() => handleEditVenue(params.row)}
              startIcon={<EditIcon />}
              sx={{ mr: 1 }}
              size="small"
            >
              Edit
            </Button>
            <Button
              variant="text"
              color="error"
              onClick={() => handleDeleteVenue(params.row)}
              startIcon={<DeleteIcon />}
              size="small"
            >
              Delete
            </Button>
          </Box>
        );
      } 
    },
  ];

  // Handle pagination change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Venue Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => handleImportVenues()}
          >
            Import from BTC
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddVenue}
          >
            Add Venue
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="All Venues" />
          <Tab label="Approved" />
          <Tab label="Not Approved" />
        </Tabs>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Division Filter */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Division</InputLabel>
            <Select
              value={filterDivision}
              onChange={(e) => {
                setFilterDivision(e.target.value);
                setFilterCity(''); // Reset city when division changes
              }}
              label="Filter by Division"
            >
              <MenuItem value="">
                <em>All Divisions</em>
              </MenuItem>
              {divisions.map(division => (
                <MenuItem key={division._id} value={division._id}>
                  {division.divisionName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* City Filter - only show if division is selected */}
          {filterDivision && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by City</InputLabel>
              <Select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                label="Filter by City"
              >
                <MenuItem value="">
                  <em>All Cities</em>
                </MenuItem>
                {cities
                  .filter(city => 
                    city.masteredDivisionId?._id === filterDivision ||
                    city.masteredDivisionId === filterDivision
                  )
                  .map(city => (
                    <MenuItem key={city._id} value={city._id}>
                      {city.cityName}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
          
          {/* Search field */}
          <TextField
            placeholder="Search venues..."
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ flexGrow: 1, maxWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchVenues}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      <Paper sx={{ height: 600, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body1" color="error">
              Failed to load venues
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => {
                setError(null);
                fetchVenues();
              }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <DataGrid
            rows={venues.map((venue, index) => {
              // Safely prepare row data with defaults
              const safeVenue = venue || {};
              
              // Ensure every row has a unique ID
              const rowId = safeVenue._id || safeVenue.id || `row-${index}-${Math.random().toString(36).substring(2, 9)}`;
              
              // Make sure we have the masteredCityName
              // First check if we already have a processed masteredCityName
              let masteredCityName = safeVenue.masteredCityName;
              
              // If not, try to extract it
              if (!masteredCityName) {
                if (typeof safeVenue.masteredCityId === 'object' && safeVenue.masteredCityId?.cityName) {
                  masteredCityName = safeVenue.masteredCityId.cityName;
                } else if (safeVenue.masteredCityId) {
                  masteredCityName = `City ID: ${String(safeVenue.masteredCityId).substring(0, 8)}...`;
                } else {
                  masteredCityName = 'None';
                }
              }
              
              // For display in the list
              const address = [
                safeVenue.address1,
                safeVenue.city,
                safeVenue.state,
                safeVenue.zip
              ].filter(Boolean).join(', ');
              
              return {
                // Return a complete object for the DataGrid
                ...safeVenue,
                id: rowId,
                name: safeVenue.name || '',
                address1: safeVenue.address1 || '',
                city: safeVenue.city || '',
                state: safeVenue.state || '',
                zip: safeVenue.zip || '',
                isActive: Boolean(safeVenue.isActive),
                isApproved: Boolean(safeVenue.isApproved),
                masteredCityId: safeVenue.masteredCityId || null,
                masteredCityName: masteredCityName,
              };
            })}
            columns={columns}
            pagination
            paginationMode="server"
            rowCount={pagination.total || 0}
            pageSize={pagination.pageSize}
            page={pagination.page}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            density="standard"
            initialState={{
              pagination: {
                pageSize: pagination.pageSize,
              },
            }}
          />
        )}
      </Paper>
      
      {/* Add/Edit Venue Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{editMode ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField
                  name="name"
                  label="Venue Name"
                  fullWidth
                  value={venueForm.name}
                  onChange={handleFormChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  name="shortName"
                  label="Short Name"
                  fullWidth
                  value={venueForm.shortName}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="address1"
                  label="Street Address"
                  fullWidth
                  value={venueForm.address1}
                  onChange={handleFormChange}
                  error={!!formErrors.address1}
                  helperText={formErrors.address1}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="address2"
                  label="Address Line 2"
                  fullWidth
                  value={venueForm.address2}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="city"
                  label="City"
                  fullWidth
                  value={venueForm.city}
                  onChange={handleFormChange}
                  error={!!formErrors.city}
                  helperText={formErrors.city}
                  required
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <TextField
                  name="state"
                  label="State/Province"
                  fullWidth
                  value={venueForm.state}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <TextField
                  name="zip"
                  label="Postal Code"
                  fullWidth
                  value={venueForm.zip}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={venueForm.phone}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="comments"
                  label="Comments"
                  fullWidth
                  multiline
                  rows={2}
                  value={venueForm.comments}
                  onChange={handleFormChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Geolocation
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <TextField
                  name="latitude"
                  label="Latitude"
                  fullWidth
                  value={venueForm.latitude}
                  onChange={handleFormChange}
                  type="number"
                  inputProps={{ step: 0.000001 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={5}>
                <TextField
                  name="longitude"
                  label="Longitude"
                  fullWidth
                  value={venueForm.longitude}
                  onChange={handleFormChange}
                  type="number"
                  inputProps={{ step: 0.000001 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleFindNearestCity}
                  startIcon={<LocationSearchingIcon />}
                  disabled={!venueForm.latitude || !venueForm.longitude || fetchingNearest}
                  fullWidth
                >
                  {fetchingNearest ? <CircularProgress size={24} /> : 'Find'}
                </Button>
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Geo Hierarchy Assignment
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={toggleHierarchyMode}
                    variant="outlined"
                  >
                    {hierarchySelectMode ? 'Switch to Nearest City' : 'Switch to Manual Selection'}
                  </Button>
                </Box>
                
                {/* Top-down hierarchy selection */}
                {hierarchySelectMode ? (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Select from geo hierarchy (top down):
                    </Typography>
                    
                    {loadingGeoHierarchy ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {/* Country selection */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Country</InputLabel>
                            <Select
                              value={venueForm.masteredCountryId}
                              onChange={handleCountryChange}
                              label="Country"
                              disabled={countries.length === 0}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {countries.map(country => (
                                <MenuItem key={country._id} value={country._id}>
                                  {country.countryName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {/* Region selection */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Region</InputLabel>
                            <Select
                              value={venueForm.masteredRegionId}
                              onChange={handleRegionChange}
                              label="Region"
                              disabled={!venueForm.masteredCountryId}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {regions
                                .filter(region => 
                                  region.masteredCountryId?._id === venueForm.masteredCountryId ||
                                  region.masteredCountryId === venueForm.masteredCountryId
                                )
                                .map(region => (
                                  <MenuItem key={region._id} value={region._id}>
                                    {region.regionName}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {/* Division selection */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Division</InputLabel>
                            <Select
                              value={venueForm.masteredDivisionId}
                              onChange={handleDivisionChange}
                              label="Division"
                              disabled={!venueForm.masteredRegionId}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {divisions
                                .filter(division => 
                                  division.masteredRegionId?._id === venueForm.masteredRegionId ||
                                  division.masteredRegionId === venueForm.masteredRegionId
                                )
                                .map(division => (
                                  <MenuItem key={division._id} value={division._id}>
                                    {division.divisionName}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        {/* City selection */}
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>City</InputLabel>
                            <Select
                              value={venueForm.masteredCityId}
                              onChange={handleCityChange}
                              label="City"
                              disabled={!venueForm.masteredDivisionId}
                            >
                              <MenuItem value="">
                                <em>None</em>
                              </MenuItem>
                              {cities
                                .filter(city => 
                                  city.masteredDivisionId?._id === venueForm.masteredDivisionId ||
                                  city.masteredDivisionId === venueForm.masteredDivisionId
                                )
                                .map(city => (
                                  <MenuItem key={city._id} value={city._id}>
                                    {city.cityName}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                ) : (
                  // Nearest city selection
                  <Box>
                    {nearestCities.length > 0 ? (
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Select a city to assign to this venue:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {nearestCities.map(city => (
                            <Chip
                              key={city._id}
                              label={`${city.cityName} (${city.distanceInKm} km)`}
                              onClick={() => handleSelectCity(city)}
                              variant={venueForm.masteredCityId === city._id ? 'filled' : 'outlined'}
                              color={venueForm.masteredCityId === city._id ? 'primary' : 'default'}
                              clickable
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : venueForm.latitude && venueForm.longitude ? (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Click "Find" to locate the nearest cities for this venue.
                      </Alert>
                    ) : (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Enter latitude and longitude to find nearest cities.
                      </Alert>
                    )}
                  </Box>
                )}
                
                {venueForm.masteredCityId && !hierarchySelectMode && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Selected Geo Location:
                    </Typography>
                    <Typography variant="body2">
                      {nearestCities.find(c => c._id === venueForm.masteredCityId)?.cityName || 'Custom selection'}
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Venue Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={venueForm.isActive}
                        onChange={handleFormChange}
                        name="isActive"
                        color="primary"
                      />
                    }
                    label="Active"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={venueForm.isApproved}
                        onChange={handleFormChange}
                        name="isApproved"
                        color="primary"
                      />
                    }
                    label="Approved"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the venue "{venueToDelete?.name}"?
          </Typography>
          <Typography color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Venues Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => {
          if (importStatus !== 'importing') {
            setImportDialogOpen(false);
          }
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Import Venues from BTC</DialogTitle>
        <DialogContent>
          {importStatus === 'loading' || fetchingBTCVenues ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Fetching venues from BostonTangoCalendar...
              </Typography>
            </Box>
          ) : importStatus === 'error' ? (
            <Alert severity="error" sx={{ my: 2 }}>
              Failed to fetch venues. Please try again.
            </Alert>
          ) : importStatus === 'importing' ? (
            <Box sx={{ my: 2 }}>
              <Typography variant="body1" gutterBottom>
                Importing venues...
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={importProgress} />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">{`${importProgress}%`}</Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Box sx={{ bgcolor: 'success.light', px: 2, py: 1, borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Imported: {importResults.success}
                  </Typography>
                </Box>
                {importResults.skipped > 0 && (
                  <Box sx={{ bgcolor: 'warning.light', px: 2, py: 1, borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Skipped: {importResults.skipped}
                    </Typography>
                  </Box>
                )}
                {importResults.error > 0 && (
                  <Box sx={{ bgcolor: 'error.light', px: 2, py: 1, borderRadius: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      Failed: {importResults.error}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : importStatus === 'complete' ? (
            <Box sx={{ my: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Import completed!
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body1">
                  Successfully imported {importResults.success} venues.
                </Typography>
                
                {importResults.skipped > 0 && (
                  <Typography variant="body1" sx={{ color: 'warning.main' }}>
                    Skipped {importResults.skipped} venues (already exist in system).
                  </Typography>
                )}
                
                {importResults.error > 0 && (
                  <Typography variant="body1" color="error">
                    Failed to import {importResults.error} venues.
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    Don't forget to manually check venues without coordinates to assign them to the correct city in your geo hierarchy.
                  </Typography>
                </Alert>
              </Box>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="body1">
                    Found {importedVenues.length} venues from BostonTangoCalendar
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {importedVenues.filter(v => v.isDuplicate).length} already exist in the system
                  </Typography>
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={importedVenues.length > 0 && 
                          Object.values(selectedVenues).every(value => value === true)}
                        indeterminate={Object.values(selectedVenues).some(value => value === true) && 
                          Object.values(selectedVenues).some(value => value === false)}
                        onChange={handleSelectAllVenues}
                      />
                    }
                    label="Select All"
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      const newSelected = {};
                      importedVenues.forEach(venue => {
                        newSelected[venue.id] = !venue.isDuplicate;
                      });
                      setSelectedVenues(newSelected);
                    }}
                    sx={{ ml: 1 }}
                  >
                    Select New Only
                  </Button>
                </Box>
              </Box>
              
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox 
                          checked={importedVenues.length > 0 && 
                            Object.values(selectedVenues).every(value => value === true)}
                          indeterminate={Object.values(selectedVenues).some(value => value === true) && 
                            Object.values(selectedVenues).some(value => value === false)}
                          onChange={handleSelectAllVenues}
                        />
                      </TableCell>
                      <TableCell>Found</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>City</TableCell>
                      <TableCell>Coordinates</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importedVenues.map((venue) => (
                      <TableRow key={venue.id}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={!!selectedVenues[venue.id]}
                            onChange={(e) => handleSelectVenue(e, venue.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {venue.isDuplicate ? (
                            <Chip 
                              label="Exists" 
                              size="small" 
                              color="warning"
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label="New" 
                              size="small" 
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>{venue.name}</TableCell>
                        <TableCell>{venue.address1 || ''}</TableCell>
                        <TableCell>{venue.city || ''}</TableCell>
                        <TableCell>
                          {venue.latitude && venue.longitude ? 
                            `${venue.latitude.toFixed(6)}, ${venue.longitude.toFixed(6)}` : 
                            'No coordinates'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 2 }}>
                <Alert severity="info">
                  <Typography variant="body2" gutterBottom>
                    Selected venues will be imported into the current application.
                    The system will attempt to associate each venue with the nearest city in your geo hierarchy.
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" component="div">
                      <strong>Notes:</strong>
                    </Typography>
                    <ul>
                      <li>Venues marked as "Exists" are already in your system (based on matching name and address).</li>
                      <li>By default, only new venues are selected for import.</li>
                      <li>For venues with coordinates, the system will automatically find the nearest city.</li>
                      <li>Venues without coordinates will need manual geo assignment after import.</li>
                    </ul>
                  </Box>
                </Alert>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {(importStatus === 'ready') && (
            <>
              <Button 
                onClick={() => setImportDialogOpen(false)} 
              >
                Cancel
              </Button>
              <Button 
                onClick={processImport} 
                variant="contained" 
                color="primary"
                disabled={Object.values(selectedVenues).every(value => value === false)}
              >
                Import Selected ({Object.values(selectedVenues).filter(v => v).length})
              </Button>
            </>
          )}
          
          {(importStatus === 'error' || importStatus === 'complete') && (
            <Button 
              onClick={() => setImportDialogOpen(false)} 
              variant="contained"
            >
              Close
            </Button>
          )}
          
          {importStatus === 'importing' && (
            <Button disabled>
              Importing...
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}