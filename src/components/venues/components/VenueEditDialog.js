'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';

/**
 * VenueEditDialog component for adding/editing venues
 */
const VenueEditDialog = ({
  open,
  onClose,
  venue = null,
  onSave,
  
  // Geo hierarchy data
  countries = [],
  regions = [],
  divisions = [],
  cities = [],
  
  // API functions
  fetchNearestCities,
  fetchGeoHierarchy,
  
  loading = false
}) => {
  const isEditMode = !!venue;
  
  // Form state
  const [formData, setFormData] = useState({
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
    isActive: true,
    isApproved: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [nearestCities, setNearestCities] = useState([]);
  const [fetchingNearest, setFetchingNearest] = useState(false);
  const [hierarchySelectMode, setHierarchySelectMode] = useState(false);
  const [loadingGeoHierarchy, setLoadingGeoHierarchy] = useState(false);
  
  // Initialize form when venue changes
  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        shortName: venue.shortName || '',
        address1: venue.address1 || venue.address?.street1 || '',
        address2: venue.address2 || venue.address?.street2 || '',
        address3: venue.address3 || '',
        city: venue.city || venue.address?.city || '',
        state: venue.state || venue.address?.state || '',
        zip: venue.zip || venue.address?.zip || venue.postalCode || '',
        phone: venue.phone || '',
        comments: venue.comments || '',
        latitude: venue.latitude || '',
        longitude: venue.longitude || '',
        masteredCityId: 
          (typeof venue.masteredCityId === 'object' ? venue.masteredCityId?._id : venue.masteredCityId) || '',
        masteredDivisionId: 
          (typeof venue.masteredDivisionId === 'object' ? venue.masteredDivisionId?._id : venue.masteredDivisionId) || '',
        masteredRegionId: 
          (typeof venue.masteredRegionId === 'object' ? venue.masteredRegionId?._id : venue.masteredRegionId) || '',
        masteredCountryId: 
          (typeof venue.masteredCountryId === 'object' ? venue.masteredCountryId?._id : venue.masteredCountryId) || '',
        isActive: venue.isActive !== undefined ? venue.isActive : true,
        isApproved: venue.isApproved || false
      });
      
      // If venue has coordinates, fetch nearest cities
      if (venue.latitude && venue.longitude) {
        handleFindNearestCity();
      }
    } else {
      // Reset form for new venue
      setFormData({
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
        isActive: true,
        isApproved: false
      });
      setNearestCities([]);
    }
    
    setFormErrors({});
    setHierarchySelectMode(false);
  }, [venue]);
  
  // Load geo hierarchy when dialog opens
  useEffect(() => {
    if (open && fetchGeoHierarchy) {
      setLoadingGeoHierarchy(true);
      fetchGeoHierarchy().finally(() => {
        setLoadingGeoHierarchy(false);
      });
    }
  }, [open, fetchGeoHierarchy]);
  
  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleFindNearestCity = async () => {
    if (!formData.longitude || !formData.latitude) {
      alert('Please enter both latitude and longitude');
      return;
    }
    
    try {
      setFetchingNearest(true);
      const cities = await fetchNearestCities(formData.longitude, formData.latitude);
      setNearestCities(cities || []);
      
      if (!cities || cities.length === 0) {
        alert('No nearby cities found. You may need to manually assign the geo hierarchy.');
      }
    } catch (error) {
      console.error('Error fetching nearest cities:', error);
      alert(`Failed to find nearest cities: ${error.message}`);
    } finally {
      setFetchingNearest(false);
    }
  };
  
  const handleSelectCity = (city) => {
    setFormData(prev => ({
      ...prev,
      masteredCityId: city._id,
      masteredDivisionId: city.masteredDivisionId?._id || '',
      masteredRegionId: city.masteredDivisionId?.masteredRegionId?._id || '',
      masteredCountryId: city.masteredDivisionId?.masteredRegionId?.masteredCountryId?._id || ''
    }));
  };
  
  // Geo hierarchy handlers
  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    setFormData(prev => ({
      ...prev,
      masteredCountryId: countryId,
      masteredRegionId: '',
      masteredDivisionId: '',
      masteredCityId: ''
    }));
  };
  
  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setFormData(prev => ({
      ...prev,
      masteredRegionId: regionId,
      masteredDivisionId: '',
      masteredCityId: ''
    }));
  };
  
  const handleDivisionChange = (e) => {
    const divisionId = e.target.value;
    setFormData(prev => ({
      ...prev,
      masteredDivisionId: divisionId,
      masteredCityId: ''
    }));
  };
  
  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setFormData(prev => ({
      ...prev,
      masteredCityId: cityId
    }));
  };
  
  const toggleHierarchyMode = () => {
    setHierarchySelectMode(!hierarchySelectMode);
    if (!hierarchySelectMode) {
      setNearestCities([]);
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = 'Venue name is required';
    }
    
    if (!formData.address1) {
      errors.address1 = 'Address is required';
    }
    
    if (!formData.city) {
      errors.city = 'City is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Format the data
    const submitData = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null
    };
    
    if (venue && venue._id) {
      submitData._id = venue._id;
    }
    
    onSave(submitData);
  };
  
  // Filter geo hierarchy based on selections
  const filteredRegions = regions.filter(region => 
    !formData.masteredCountryId || 
    region.masteredCountryId?._id === formData.masteredCountryId ||
    region.masteredCountryId === formData.masteredCountryId
  );
  
  const filteredDivisions = divisions.filter(division => 
    !formData.masteredRegionId || 
    division.masteredRegionId?._id === formData.masteredRegionId ||
    division.masteredRegionId === formData.masteredRegionId
  );
  
  const filteredCities = cities.filter(city => 
    !formData.masteredDivisionId || 
    city.masteredDivisionId?._id === formData.masteredDivisionId ||
    city.masteredDivisionId === formData.masteredDivisionId
  );
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>{isEditMode ? 'Edit Venue' : 'Add New Venue'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                name="name"
                label="Venue Name"
                fullWidth
                value={formData.name}
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
                value={formData.shortName}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="address1"
                label="Street Address"
                fullWidth
                value={formData.address1}
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
                value={formData.address2}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="city"
                label="City"
                fullWidth
                value={formData.city}
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
                value={formData.state}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <TextField
                name="zip"
                label="Postal Code"
                fullWidth
                value={formData.zip}
                onChange={handleFormChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone Number"
                fullWidth
                value={formData.phone}
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
                value={formData.comments}
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
                value={formData.latitude}
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
                value={formData.longitude}
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
                disabled={!formData.latitude || !formData.longitude || fetchingNearest}
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
                            value={formData.masteredCountryId}
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
                            value={formData.masteredRegionId}
                            onChange={handleRegionChange}
                            label="Region"
                            disabled={!formData.masteredCountryId}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {filteredRegions.map(region => (
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
                            value={formData.masteredDivisionId}
                            onChange={handleDivisionChange}
                            label="Division"
                            disabled={!formData.masteredRegionId}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {filteredDivisions.map(division => (
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
                            value={formData.masteredCityId}
                            onChange={handleCityChange}
                            label="City"
                            disabled={!formData.masteredDivisionId}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {filteredCities.map(city => (
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
                            label={`${city.cityName} (${city.distanceInKm?.toFixed(1) || '?'} km)`}
                            onClick={() => handleSelectCity(city)}
                            variant={formData.masteredCityId === city._id ? 'filled' : 'outlined'}
                            color={formData.masteredCityId === city._id ? 'primary' : 'default'}
                            clickable
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : formData.latitude && formData.longitude ? (
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
              
              {formData.masteredCityId && !hierarchySelectMode && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Selected Geo Location:
                  </Typography>
                  <Typography variant="body2">
                    {nearestCities.find(c => c._id === formData.masteredCityId)?.cityName || 'Custom selection'}
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
                      checked={formData.isActive}
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
                      checked={formData.isApproved}
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
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : (isEditMode ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VenueEditDialog;