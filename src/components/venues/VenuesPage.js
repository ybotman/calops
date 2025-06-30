'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import TabPanel from '@/components/common/TabPanel';
import { VenueSearchBar, VenueTable, VenueEditDialog } from './components';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

/**
 * VenuesPage component
 * Main presentation component for venue management
 */
const VenuesPage = ({
  // Data
  venues,
  filteredVenues,
  loading = false,
  error = null,
  
  // Filters
  searchTerm,
  setSearchTerm,
  tabValue,
  setTabValue,
  
  // Division and City filters
  filterDivision,
  setFilterDivision,
  filterCity,
  setFilterCity,
  
  // Venue operations
  createVenue,
  updateVenue,
  deleteVenue,
  validateVenueGeo,
  batchValidateGeo,
  
  // Geo hierarchy data
  countries,
  regions,
  divisions,
  cities,
  filteredCities,
  
  // Geo hierarchy selection
  selectedCountry = null,
  selectedRegion = null,
  selectedDivision = null,
  selectedCity = null,
  
  setSelectedCountry,
  setSelectedRegion,
  setSelectedDivision,
  setSelectedCity,
  
  // Other
  pagination = { page: 0, pageSize: 10, totalCount: 0 },
  setPagination,
  getCityCoordinates,
  fetchGeoDataById,
  fetchNearestCities,
  fetchGeoHierarchy
}) => {
  // Local state for dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validateGeoDialogOpen, setValidateGeoDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  
  // Handlers
  const handleAddVenue = () => {
    setEditingVenue(null);
    setDialogOpen(true);
  };
  
  const handleEditVenue = (venue) => {
    setEditingVenue(venue);
    setDialogOpen(true);
  };
  
  const handleValidateGeo = (venue) => {
    if (venue) {
      // For single venue validation
      if (validateVenueGeo) {
        validateVenueGeo(venue._id || venue.id);
      }
    } else {
      // For batch validation
      setValidateGeoDialogOpen(true);
    }
  };
  
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      page,
      pageSize
    });
  };
  
  const handleDeleteVenue = (venue) => {
    if (window.confirm(`Are you sure you want to delete venue: ${venue.name || venue.displayName}?`)) {
      deleteVenue(venue.id || venue._id);
    }
  };
  
  const handleSaveVenue = async (venueData) => {
    try {
      if (editingVenue) {
        // Update existing venue
        await updateVenue(venueData);
      } else {
        // Create new venue
        await createVenue(venueData);
      }
      setDialogOpen(false);
      setEditingVenue(null);
    } catch (error) {
      console.error('Error saving venue:', error);
      alert(`Failed to save venue: ${error.message}`);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Venue Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
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
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="venue tabs"
          >
            <Tab label="All Venues" />
            <Tab label="Approved" />
            <Tab label="Not Approved" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Division Filter */}
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Division</InputLabel>
              <Select
                value={filterDivision || ''}
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
                  value={filterCity || ''}
                  onChange={(e) => setFilterCity(e.target.value)}
                  label="Filter by City"
                >
                  <MenuItem value="">
                    <em>All Cities</em>
                  </MenuItem>
                  {(filteredCities || []).map(city => (
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
      </Paper>
      
      <TabPanel value={tabValue} index={0}>
        <Typography variant="body1">
          {loading ? 'Loading venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} venues found`}
        </Typography>
        <VenueTable 
          venues={filteredVenues}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onEdit={handleEditVenue}
          onDelete={handleDeleteVenue}
          onValidateGeo={handleValidateGeo}
          density="compact"
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="body1">
          {loading ? 'Loading approved venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} approved venues found`}
        </Typography>
        <VenueTable 
          venues={filteredVenues}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onEdit={handleEditVenue}
          onDelete={handleDeleteVenue}
          onValidateGeo={handleValidateGeo}
          density="compact"
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1">
          {loading ? 'Loading not approved venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} not approved venues found`}
        </Typography>
        <VenueTable 
          venues={filteredVenues}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onEdit={handleEditVenue}
          onDelete={handleDeleteVenue}
          onValidateGeo={handleValidateGeo}
          density="compact"
        />
      </TabPanel>
      
      {/* Venue Edit Dialog */}
      <VenueEditDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingVenue(null);
        }}
        venue={editingVenue}
        onSave={handleSaveVenue}
        countries={countries}
        regions={regions}
        divisions={divisions}
        cities={cities}
        fetchNearestCities={fetchNearestCities}
        fetchGeoHierarchy={fetchGeoHierarchy}
      />

      {/* Other dialogs will go here */}
    </Box>
  );
};

// Using modern JavaScript default parameters instead of PropTypes and defaultProps

export default VenuesPage;