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

  // Fetch venues on component mount and when app changes
  useEffect(() => {
    fetchVenues();
  }, [currentApp.id, pagination.page, pagination.pageSize, searchTerm]);

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
      
      const response = await axios.get('/api/venues', {
        params: {
          appId: currentApp.id,
          page: pagination.page + 1,
          limit: pagination.pageSize,
          search: searchTerm,
        }
      });
      
      if (response.data && response.data.data) {
        setVenues(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
        }));
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
    
    setEditMode(true);
    setSelectedVenueId(venueId);
    
    // Format the form data from the venue
    const formData = {
      name: venue.name || '',
      shortName: venue.shortName || '',
      address1: venue.address1 || '',
      address2: venue.address2 || '',
      address3: venue.address3 || '',
      city: venue.city || '',
      state: venue.state || '',
      zip: venue.zip || '',
      phone: venue.phone || '',
      comments: venue.comments || '',
      latitude: venue.latitude || '',
      longitude: venue.longitude || '',
      masteredCityId: venue.masteredCityId?._id || venue.masteredCityId || '',
      masteredDivisionId: venue.masteredDivisionId?._id || venue.masteredDivisionId || '',
      masteredRegionId: venue.masteredRegionId?._id || venue.masteredRegionId || '',
      masteredCountryId: venue.masteredCountryId?._id || venue.masteredCountryId || '',
      isActive: venue.isActive || false,
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
        await axios.put(`/api/venues/${selectedVenueId}`, formattedData);
        alert('Venue updated successfully!');
      } else {
        // Create new venue
        console.log('Creating new venue');
        await axios.post('/api/venues', formattedData);
        alert('Venue created successfully!');
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
      field: 'address', 
      headerName: 'Address', 
      flex: 1.5, 
      valueFormatter: (params) => {
        // Simple concatenation of address parts directly from the row (safer approach)
        if (!params) return '';
        
        const row = params.row || {};
        return [
          row.address1,
          row.city,
          row.state,
          row.zip
        ].filter(Boolean).join(', ');
      }
    },
    { 
      field: 'masteredCityName', 
      headerName: 'Mastered City', 
      flex: 1,
      // Use valueFormatter instead which is more reliable
      valueFormatter: (params) => {
        if (!params || !params.row) return 'None';
        
        const row = params.row;
        const cityName = row.masteredCityId?.cityName;
        return cityName || 'None';
      }
    },
    { 
      field: 'isActive', 
      headerName: 'Status', 
      width: 120,
      type: 'boolean',
      renderCell: (params) => {
        // Simple boolean check avoiding params.value/row complexity
        if (!params) return <Chip label="Unknown" size="small" />;
        
        const isActive = Boolean(params.row?.isActive);
        return (
          <Chip 
            label={isActive ? 'Active' : 'Inactive'} 
            color={isActive ? 'success' : 'default'}
            size="small"
          />
        );
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
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddVenue}
        >
          Add Venue
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <TextField
          placeholder="Search venues..."
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
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
              
              // Extract cityName to a separate field to avoid nested property access in grid
              const masteredCityName = safeVenue.masteredCityId?.cityName || '';
              
              return {
                // Only include safe properties
                id: rowId,
                name: safeVenue.name || '',
                address1: safeVenue.address1 || '',
                city: safeVenue.city || '',
                state: safeVenue.state || '',
                zip: safeVenue.zip || '',
                isActive: Boolean(safeVenue.isActive),
                masteredCityId: safeVenue.masteredCityId || null,
                masteredCityName: masteredCityName,
                masteredDivisionId: safeVenue.masteredDivisionId || null,
                masteredRegionId: safeVenue.masteredRegionId || null,
                masteredCountryId: safeVenue.masteredCountryId || null,
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
    </Box>
  );
}