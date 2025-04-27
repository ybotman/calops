'use client';

import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab, Paper, Button } from '@mui/material';
import TabPanel from '@/components/common/TabPanel';
import { VenueSearchBar, VenueTable } from './components';
import AddIcon from '@mui/icons-material/Add';

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
  
  const handleDeleteVenue = (venue) => {
    if (window.confirm(`Are you sure you want to delete venue: ${venue.name || venue.displayName}?`)) {
      deleteVenue(venue.id || venue._id);
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
        <VenueTable 
          venues={filteredVenues}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onEdit={handleEditVenue}
          onDelete={handleDeleteVenue}
          onValidateGeo={handleValidateGeo}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="body1">
          {loading ? 'Loading validated venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} validated venues found`}
        </Typography>
        <VenueTable 
          venues={filteredVenues}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onEdit={handleEditVenue}
          onDelete={handleDeleteVenue}
          onValidateGeo={handleValidateGeo}
        />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="body1">
          {loading ? 'Loading invalid venues...' : 
            error ? `Error loading venues: ${error.message}` :
            `${filteredVenues.length} invalid venues found`}
        </Typography>
        <VenueTable 
          venues={filteredVenues}
          loading={loading}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          onEdit={handleEditVenue}
          onDelete={handleDeleteVenue}
          onValidateGeo={handleValidateGeo}
        />
      </TabPanel>
      
      {/* Dialogs will go here */}
    </Box>
  );
};

// Using modern JavaScript default parameters instead of PropTypes and defaultProps

export default VenuesPage;