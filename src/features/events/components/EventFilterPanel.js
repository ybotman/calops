'use client';

import { useState, useEffect } from 'react';
import { 
  Paper, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  Autocomplete,
  Chip,
  IconButton,
  Drawer,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';

const EventFilterPanel = ({ 
  filters, 
  setFilters, 
  regions = [],
  divisions = [],
  cities = [],
  categories = [],
  venues = [],
  organizers = [],
  onSearch,
  onClear,
  isSearching = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({ ...filters });
  const [expanded, setExpanded] = useState(false);

  // Set default dates if they're not already set
  useEffect(() => {
    const updatedFilters = { ...filters };
    let changed = false;
    
    // Default start date to today if not set
    if (!updatedFilters.startDate) {
      updatedFilters.startDate = new Date();
      changed = true;
    }
    
    // Default end date to +3 weeks if not set
    if (!updatedFilters.endDate) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 21); // 3 weeks
      updatedFilters.endDate = endDate;
      changed = true;
    }
    
    if (changed) {
      setFilters(updatedFilters);
    }
  }, []);

  // Update local filters when parent filters change
  useEffect(() => {
    setLocalFilters({ ...filters });
  }, [filters]);
  
  // Log data counts when component mounts or props change
  useEffect(() => {
    console.log(`EventFilterPanel - Data loaded: ${regions.length} regions, ${divisions.length} divisions, ${cities.length} cities`);
  }, [regions, divisions, cities]);

  // Handle input changes with hierarchy awareness
  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    
    // Clear downstream selections when a parent selection changes
    if (field === 'masteredRegionName') {
      // When region changes, clear division and city
      newFilters.masteredDivisionName = '';
      newFilters.masteredCityName = '';
      console.log(`Region changed to ${value}, clearing division and city filters`);
    } else if (field === 'masteredDivisionName') {
      // When division changes, clear city
      newFilters.masteredCityName = '';
      console.log(`Division changed to ${value}, clearing city filter`);
    } else if (field === 'masteredCityName') {
      // Log city selection specifically for debugging
      console.log(`City filter changed to: "${value}"`);
    }
    
    setLocalFilters(newFilters);
    
    // Only log important filter changes
    if (field === 'masteredRegionName' || field === 'masteredDivisionName' || field === 'masteredCityName') {
      console.log(`Filter changed: ${field} = "${value}"`);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    // First synchronize the local filters with parent
    setFilters(localFilters);
    
    // Then trigger the search callback with local filters
    if (onSearch) {
      // Log minimal search info
      console.log('Search button clicked');
      onSearch(localFilters);
    }
    
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Handle clear filters button click
  const handleClear = () => {
    // Get today and today+3weeks for default dates
    const today = new Date();
    const threeWeeksLater = new Date();
    threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);
    
    const clearedFilters = {
      titleSearch: '',
      descriptionSearch: '',
      startDate: today,
      endDate: threeWeeksLater,
      status: 'all',
      masteredRegionName: '',
      masteredDivisionName: '',
      masteredCityName: '',
      categories: [],
      organizerId: '',
      venueId: '',
      active: true
    };
    setLocalFilters(clearedFilters);
    setFilters(clearedFilters);
    onClear && onClear();
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const filterContent = (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Four vertical columns for filters */}
          
          {/* Column 1: Dates */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Dates</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Start Date</Typography>
                <DatePicker
                  value={localFilters.startDate ? new Date(localFilters.startDate) : null}
                  onChange={(date) => handleChange('startDate', date)}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>End Date</Typography>
                <DatePicker
                  value={localFilters.endDate ? new Date(localFilters.endDate) : null}
                  onChange={(date) => handleChange('endDate', date)}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Status</Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={localFilters.status || 'all'}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      handleChange('status', newStatus);
                      
                      // Also set the active flag based on status for explicit filtering
                      if (newStatus === 'active') {
                        handleChange('active', true);
                      } else if (newStatus === 'inactive') {
                        handleChange('active', false);
                      } else {
                        // For 'all', remove the active flag
                        handleChange('active', undefined);
                      }
                    }}
                    label="Status"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Grid>
          
          {/* Column 2: GeoLocation */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>GeoLocation</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Region (REG)</Typography>
                <Autocomplete
                  options={regions}
                  getOptionLabel={(option) => {
                    return typeof option === 'string' ? option : (option.name || `Region ${option.id || '?'}`)
                  }}
                  value={regions.find(r => r.name === localFilters.masteredRegionName) || null}
                  onChange={(_, newValue) => handleChange('masteredRegionName', newValue ? newValue.name : '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Region" size="small" />
                  )}
                  noOptionsText="No regions available"
                  renderOption={(props, option) => {
                    // Extract key from props and rest of props
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        {option.name || `Region ${option.id || ''}`}
                      </li>
                    );
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Division (DIV)</Typography>
                <Autocomplete
                  options={
                    localFilters.masteredRegionName
                      ? (() => {
                          const selectedRegion = regions.find(r => r.name === localFilters.masteredRegionName);
                          // Selected region for filtering
                          
                          // If no region selected, return all divisions
                          if (!selectedRegion) return divisions;
                          
                          // Find all divisions related to this region
                          const filteredDivisions = divisions.filter(division => {
                            // Try different ways to match the region ID
                            const regionMatches = [
                              // Direct match
                              division.regionId === selectedRegion.id,
                              // String comparison (in case one is string and one is ObjectId)
                              String(division.regionId) === String(selectedRegion.id),
                              // Try with masteredRegionId
                              division.masteredRegionId === selectedRegion.id,
                              String(division.masteredRegionId) === String(selectedRegion.id),
                              // Check if IDs appear within the division object anywhere
                              JSON.stringify(division).includes(selectedRegion.id)
                            ];
                            
                            return regionMatches.some(match => match === true);
                          });
                          
                          console.log(`Found ${filteredDivisions.length} divisions for region ${selectedRegion.name}`);
                          return filteredDivisions.length > 0 ? filteredDivisions : divisions;
                        })()
                      : divisions
                  }
                  getOptionLabel={(option) => {
                    return typeof option === 'string' ? option : (option.name || `Division ${option.id || '?'}`)
                  }}
                  value={divisions.find(d => d.name === localFilters.masteredDivisionName) || null}
                  onChange={(_, newValue) => handleChange('masteredDivisionName', newValue ? newValue.name : '')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Select Division" 
                      size="small"
                      disabled={!localFilters.masteredRegionName} // Disable if no region selected
                    />
                  )}
                  noOptionsText={localFilters.masteredRegionName ? "No divisions available for this region" : "Select a region first"}
                  renderOption={(props, option) => {
                    // Extract key from props and rest of props
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        {option.name || `Division ${option.id || ''}`}
                      </li>
                    );
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>City (CIT)</Typography>
                <Autocomplete
                  options={
                    // Filter cities by selected division if available
                    localFilters.masteredDivisionName
                      ? (() => {
                          const selectedDivision = divisions.find(d => d.name === localFilters.masteredDivisionName);
                          console.log('Selected Division for filtering cities:', selectedDivision);
                          
                          // If no division selected, return all cities
                          if (!selectedDivision) return cities;
                          
                          // Find all cities related to this division
                          const filteredCities = cities.filter(city => {
                            // Try different ways to match the division ID
                            const divisionMatches = [
                              // Direct match
                              city.divisionId === selectedDivision.id,
                              // String comparison
                              String(city.divisionId) === String(selectedDivision.id),
                              // Try with masteredDivisionId
                              city.masteredDivisionId === selectedDivision.id,
                              String(city.masteredDivisionId) === String(selectedDivision.id),
                              // Check if IDs appear within the city object anywhere
                              JSON.stringify(city).includes(selectedDivision.id)
                            ];
                            
                            return divisionMatches.some(match => match === true);
                          });
                          
                          // Found cities for the selected division
                          return filteredCities.length > 0 ? filteredCities : cities;
                        })()
                      : // Otherwise filter by region if available
                      localFilters.masteredRegionName
                      ? (() => {
                          const selectedRegion = regions.find(r => r.name === localFilters.masteredRegionName);
                          console.log('Selected Region for filtering cities:', selectedRegion);
                          
                          // If no region selected, return all cities
                          if (!selectedRegion) return cities;
                          
                          // Find all cities related to this region
                          const filteredCities = cities.filter(city => {
                            // Try different ways to match the region ID
                            const regionMatches = [
                              // Direct match
                              city.regionId === selectedRegion.id,
                              // String comparison
                              String(city.regionId) === String(selectedRegion.id),
                              // Try with masteredRegionId
                              city.masteredRegionId === selectedRegion.id,
                              String(city.masteredRegionId) === String(selectedRegion.id),
                              // Check if IDs appear within the city object anywhere
                              JSON.stringify(city).includes(selectedRegion.id)
                            ];
                            
                            return regionMatches.some(match => match === true);
                          });
                          
                          console.log(`Found ${filteredCities.length} cities for region ${selectedRegion.name}`);
                          return filteredCities.length > 0 ? filteredCities : cities;
                        })()
                      : cities
                  }
                  getOptionLabel={(option) => {
                    return typeof option === 'string' ? option : (option.name || `City ${option.id || '?'}`)
                  }}
                  value={cities.find(c => c.name === localFilters.masteredCityName) || null}
                  onChange={(_, newValue) => {
                    // Extract the city name and ensure it's properly handled
                    const cityName = newValue ? newValue.name || newValue.cityName || (typeof newValue === 'string' ? newValue : '') : '';
                    handleChange('masteredCityName', cityName);
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Select City" 
                      size="small" 
                      disabled={!localFilters.masteredRegionName} // Disable if no region or division selected
                    />
                  )}
                  noOptionsText={
                    !localFilters.masteredRegionName 
                      ? "Select a region first" 
                      : !localFilters.masteredDivisionName
                      ? "Select a division first"
                      : "No cities available for this division"
                  }
                  renderOption={(props, option) => {
                    // Extract key from props and rest of props
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        {option.name || `City ${option.id || ''}`}
                      </li>
                    );
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* Column 3: Dimensions */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Dimensions</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Categories</Typography>
                <Autocomplete
                  multiple
                  options={categories}
                  getOptionLabel={(option) => {
                    return typeof option === 'string' ? option : (option.name || option.categoryName || option.id || '')
                  }}
                  value={localFilters.categories || []}
                  onChange={(_, newValue) => handleChange('categories', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Categories" size="small" />
                  )}
                  noOptionsText="No categories available"
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip 
                        label={typeof option === 'string' ? option : (option.name || option.categoryName || option.id || '')} 
                        {...getTagProps({ index })} 
                        size="small"
                      />
                    ))
                  }
                  renderOption={(props, option) => {
                    // Extract key from props and rest of props
                    const { key, ...restProps } = props;
                    return (
                      <li key={key} {...restProps}>
                        {typeof option === 'string' ? option : (option.name || option.categoryName || option.id || '')}
                      </li>
                    );
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Organizer</Typography>
                <Autocomplete
                  options={organizers}
                  getOptionLabel={(option) => option.fullName || option.name || ''}
                  value={organizers.find(o => o._id === localFilters.organizerId) || null}
                  onChange={(_, newValue) => handleChange('organizerId', newValue ? newValue._id : '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Organizer" size="small" />
                  )}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Venue</Typography>
                <Autocomplete
                  options={venues}
                  getOptionLabel={(option) => option.venueName || option.name || ''}
                  value={venues.find(v => v._id === localFilters.venueId) || null}
                  onChange={(_, newValue) => handleChange('venueId', newValue ? newValue._id : '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Venue" size="small" />
                  )}
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* Column 4: Search Text */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Search Text</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Title Search</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search in title"
                  value={localFilters.titleSearch || ''}
                  onChange={(e) => handleChange('titleSearch', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    endAdornment: localFilters.titleSearch ? (
                      <IconButton size="small" onClick={() => handleChange('titleSearch', '')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : null,
                  }}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Description Search</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search in description"
                  value={localFilters.descriptionSearch || ''}
                  onChange={(e) => handleChange('descriptionSearch', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    endAdornment: localFilters.descriptionSearch ? (
                      <IconButton size="small" onClick={() => handleChange('descriptionSearch', '')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ) : null,
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          
          {/* Action buttons */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" onClick={handleClear} disabled={isSearching}>
                Clear Filters
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSearch}
                startIcon={isSearching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );

  // Helper component to display active filters as chips
  const ActiveFilterChips = () => {
    const activeFilters = [];
    
    if (localFilters.titleSearch) {
      activeFilters.push({ key: 'titleSearch', label: `Title: "${localFilters.titleSearch}"` });
    }
    
    if (localFilters.descriptionSearch) {
      activeFilters.push({ key: 'descSearch', label: `Desc: "${localFilters.descriptionSearch}"` });
    }
    
    if (localFilters.startDate) {
      activeFilters.push({ 
        key: 'startDate', 
        label: `From: ${new Date(localFilters.startDate).toLocaleDateString()}` 
      });
    }
    
    if (localFilters.endDate) {
      activeFilters.push({ 
        key: 'endDate', 
        label: `To: ${new Date(localFilters.endDate).toLocaleDateString()}` 
      });
    }
    
    if (localFilters.masteredRegionName) {
      activeFilters.push({ key: 'region', label: `REG: ${localFilters.masteredRegionName}` });
    }
    
    if (localFilters.masteredDivisionName) {
      activeFilters.push({ key: 'division', label: `DIV: ${localFilters.masteredDivisionName}` });
    }
    
    if (localFilters.masteredCityName) {
      activeFilters.push({ key: 'city', label: `CIT: ${localFilters.masteredCityName}` });
    }
    
    if (localFilters.organizerId) {
      const org = organizers.find(o => o._id === localFilters.organizerId);
      activeFilters.push({ key: 'organizer', label: `Org: ${org?.name || org?.fullName || 'Selected'}` });
    }
    
    if (localFilters.venueId) {
      const venue = venues.find(v => v._id === localFilters.venueId);
      activeFilters.push({ key: 'venue', label: `Venue: ${venue?.venueName || venue?.name || 'Selected'}` });
    }
    
    if (localFilters.categories && localFilters.categories.length > 0) {
      activeFilters.push({ key: 'categories', label: `${localFilters.categories.length} categories` });
    }
    
    if (localFilters.status && localFilters.status !== 'all') {
      activeFilters.push({ key: 'status', label: `Status: ${localFilters.status}` });
    }
    
    if (activeFilters.length === 0) return null;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        {activeFilters.map((filter) => (
          <Chip
            key={filter.key}
            label={filter.label}
            size="small"
            onDelete={() => {
              if (filter.key === 'categories') {
                handleChange('categories', []);
              } else if (filter.key === 'startDate' || filter.key === 'endDate') {
                // Don't clear dates completely, reset to defaults
                const today = new Date();
                const threeWeeksLater = new Date();
                threeWeeksLater.setDate(threeWeeksLater.getDate() + 21);
                
                handleChange(filter.key, filter.key === 'startDate' ? today : threeWeeksLater);
              } else {
                handleChange(filter.key, '');
              }
            }}
          />
        ))}
      </Box>
    );
  };

  // Mobile version uses a drawer
  if (isMobile) {
    return (
      <>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Event Search</Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={toggleDrawer(true)}
              startIcon={<FilterListIcon />}
            >
              Filters
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search in title..."
              value={localFilters.titleSearch || ''}
              onChange={(e) => handleChange('titleSearch', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
            </Button>
          </Box>
          
          <ActiveFilterChips />
        </Box>

        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90vh', overflowY: 'auto' }
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}`, position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Filter Events</Typography>
              <IconButton onClick={toggleDrawer(false)}>
                <ClearIcon />
              </IconButton>
            </Box>
          </Box>
          {filterContent}
        </Drawer>
      </>
    );
  }

  // Desktop version
  return (
    <Paper sx={{ mb: 3 }}>
      {filterContent}
    </Paper>
  );
};

export default EventFilterPanel;