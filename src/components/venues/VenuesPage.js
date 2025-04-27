'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tabs, Tab, Paper, Button } from '@mui/material';
import TabPanel from '@/components/common/TabPanel';
import { VenueSearchBar } from './components';
import AddIcon from '@mui/icons-material/Add';

/**
 * VenuesPage component
 * Main presentation component for venue management
 */
const VenuesPage = ({
  // Data
  venues,
  filteredVenues,
  loading,
  error,
  
  // Filters
  searchTerm,
  setSearchTerm,
  tabValue,
  setTabValue,
  
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
  
  // Geo hierarchy selection
  selectedCountry,
  selectedRegion,
  selectedDivision,
  selectedCity,
  
  setSelectedCountry,
  setSelectedRegion,
  setSelectedDivision,
  setSelectedCity,
  
  // Other
  pagination,
  setPagination,
  getCityCoordinates,
  fetchGeoDataById
}) => {
  // Local state for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [validateGeoDialogOpen, setValidateGeoDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  
  // Handlers
  const handleAddVenue = () => setAddDialogOpen(true);
  
  const handleEditVenue = (venue) => {
    setEditingVenue(venue);
    setEditDialogOpen(true);
  };
  
  const handleValidateGeo = () => setValidateGeoDialogOpen(true);
  
  const handleImport = () => setImportDialogOpen(true);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      page,
      pageSize
    });
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
            <Tab label="Validated" />
            <Tab label="Invalid Geo" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <VenueSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search venues by name, city, or address..."
          />
        </Box>
      </Paper>
      
      <TabPanel value={tabValue} index={0}>
        <Typography variant="body1">
          {loading ? 'Loading venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} venues found`}
        </Typography>
        {/* VenueTable will go here */}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="body1">
          {loading ? 'Loading validated venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} validated venues found`}
        </Typography>
        {/* VenueTable will go here */}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1">
          {loading ? 'Loading invalid venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} invalid venues found`}
        </Typography>
        {/* VenueTable will go here */}
      </TabPanel>
      
      {/* Dialogs will go here */}
    </Box>
  );
};

VenuesPage.propTypes = {
  // Data
  venues: PropTypes.array.isRequired,
  filteredVenues: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  
  // Filters
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  tabValue: PropTypes.number.isRequired,
  setTabValue: PropTypes.func.isRequired,
  
  // Venue operations
  createVenue: PropTypes.func.isRequired,
  updateVenue: PropTypes.func.isRequired,
  deleteVenue: PropTypes.func.isRequired,
  validateVenueGeo: PropTypes.func.isRequired,
  batchValidateGeo: PropTypes.func.isRequired,
  
  // Geo hierarchy data
  countries: PropTypes.array.isRequired,
  regions: PropTypes.array.isRequired,
  divisions: PropTypes.array.isRequired,
  cities: PropTypes.array.isRequired,
  
  // Geo hierarchy selection
  selectedCountry: PropTypes.string,
  selectedRegion: PropTypes.string,
  selectedDivision: PropTypes.string,
  selectedCity: PropTypes.string,
  
  setSelectedCountry: PropTypes.func.isRequired,
  setSelectedRegion: PropTypes.func.isRequired,
  setSelectedDivision: PropTypes.func.isRequired,
  setSelectedCity: PropTypes.func.isRequired,
  
  // Other
  pagination: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    totalCount: PropTypes.number
  }),
  setPagination: PropTypes.func.isRequired,
  getCityCoordinates: PropTypes.func.isRequired,
  fetchGeoDataById: PropTypes.func.isRequired
};

VenuesPage.defaultProps = {
  loading: false,
  error: null,
  selectedCountry: null,
  selectedRegion: null,
  selectedDivision: null,
  selectedCity: null,
  pagination: {
    page: 0,
    pageSize: 10,
    totalCount: 0
  }
};

export default VenuesPage;