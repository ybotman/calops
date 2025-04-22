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
  AccordionDetails
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
  onClear 
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

  // Handle input changes
  const handleChange = (field, value) => {
    setLocalFilters({ ...localFilters, [field]: value });
  };

  // Handle search button click
  const handleSearch = () => {
    setFilters(localFilters);
    onSearch && onSearch(localFilters);
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
                    onChange={(e) => handleChange('status', e.target.value)}
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
                  getOptionLabel={(option) => option.name || option}
                  value={regions.find(r => r.name === localFilters.masteredRegionName) || null}
                  onChange={(_, newValue) => handleChange('masteredRegionName', newValue ? newValue.name : '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Region" size="small" />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      {option.name || "? Unknown"}
                    </li>
                  )}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Division (DIV)</Typography>
                <Autocomplete
                  options={divisions}
                  getOptionLabel={(option) => option.name || option}
                  value={divisions.find(d => d.name === localFilters.masteredDivisionName) || null}
                  onChange={(_, newValue) => handleChange('masteredDivisionName', newValue ? newValue.name : '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Division" size="small" />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      {option.name || "? Unknown"}
                    </li>
                  )}
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>City (CIT)</Typography>
                <Autocomplete
                  options={cities}
                  getOptionLabel={(option) => option.name || option}
                  value={cities.find(c => c.name === localFilters.masteredCityName) || null}
                  onChange={(_, newValue) => handleChange('masteredCityName', newValue ? newValue.name : '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Select City" size="small" />
                  )}
                  renderOption={(props, option) => (
                    <li {...props}>
                      {option.name || "? Unknown"}
                    </li>
                  )}
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
                  getOptionLabel={(option) => option.name || option}
                  value={localFilters.categories || []}
                  onChange={(_, newValue) => handleChange('categories', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Categories" size="small" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip 
                        label={option.name || option} 
                        {...getTagProps({ index })} 
                        size="small"
                      />
                    ))
                  }
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
              <Button variant="outlined" onClick={handleClear}>
                Clear Filters
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSearch}
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );

  // Mobile version uses a drawer
  if (isMobile) {
    return (
      <>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search events..."
              value={localFilters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <Button
              variant="outlined"
              color="primary"
              onClick={toggleDrawer(true)}
              sx={{ ml: 1, minWidth: 0, px: 1 }}
            >
              <FilterListIcon />
            </Button>
          </Box>
          <ActiveFilterChips filters={filters} onClear={handleClear} />
        </Box>

        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          PaperProps={{
            sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '80vh' }
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6">Filter Events</Typography>
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

// Helper component for desktop filter layout
const DesktopFilterFields = ({ localFilters, handleChange, regions, cities, organizers }) => (
  <>
    {/* Date Range */}
    <Grid item xs={12} md={6}>
      <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <DatePicker
          label="Start Date"
          value={localFilters.startDate ? new Date(localFilters.startDate) : null}
          onChange={(date) => handleChange('startDate', date)}
          slotProps={{
            textField: { 
              fullWidth: true,
              size: 'small'
            }
          }}
        />
        <DatePicker
          label="End Date"
          value={localFilters.endDate ? new Date(localFilters.endDate) : null}
          onChange={(date) => handleChange('endDate', date)}
          slotProps={{
            textField: { 
              fullWidth: true,
              size: 'small'
            }
          }}
        />
      </Box>
    </Grid>

    {/* Status */}
    <Grid item xs={12} md={6}>
      <Typography variant="subtitle2" gutterBottom>Status</Typography>
      <FormControl fullWidth size="small">
        <InputLabel>Status</InputLabel>
        <Select
          value={localFilters.status || 'all'}
          onChange={(e) => handleChange('status', e.target.value)}
          label="Status"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </FormControl>
    </Grid>

    {/* Region */}
    <Grid item xs={12} md={6}>
      <Typography variant="subtitle2" gutterBottom>Region</Typography>
      <Autocomplete
        options={regions}
        getOptionLabel={(option) => option.name || option}
        value={regions.find(r => r.name === localFilters.masteredRegionName) || null}
        onChange={(_, newValue) => handleChange('masteredRegionName', newValue ? newValue.name : '')}
        renderInput={(params) => (
          <TextField {...params} label="Select Region" size="small" />
        )}
      />
    </Grid>

    {/* City */}
    <Grid item xs={12} md={6}>
      <Typography variant="subtitle2" gutterBottom>City</Typography>
      <Autocomplete
        options={cities}
        getOptionLabel={(option) => option.name || option}
        value={cities.find(c => c.name === localFilters.masteredCityName) || null}
        onChange={(_, newValue) => handleChange('masteredCityName', newValue ? newValue.name : '')}
        renderInput={(params) => (
          <TextField {...params} label="Select City" size="small" />
        )}
      />
    </Grid>

    {/* Organizer */}
    <Grid item xs={12}>
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
    </Grid>
  </>
);

// Helper component for mobile filter layout
const MobileFilterFields = ({ localFilters, handleChange, regions, cities, organizers }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {/* Date Range */}
    <Box>
      <Typography variant="subtitle2" gutterBottom>Start Date</Typography>
      <DatePicker
        value={localFilters.startDate ? new Date(localFilters.startDate) : null}
        onChange={(date) => handleChange('startDate', date)}
        slotProps={{
          textField: { 
            fullWidth: true,
            size: 'small'
          }
        }}
      />
    </Box>
    
    <Box>
      <Typography variant="subtitle2" gutterBottom>End Date</Typography>
      <DatePicker
        value={localFilters.endDate ? new Date(localFilters.endDate) : null}
        onChange={(date) => handleChange('endDate', date)}
        slotProps={{
          textField: { 
            fullWidth: true,
            size: 'small'
          }
        }}
      />
    </Box>

    {/* Status */}
    <Box>
      <Typography variant="subtitle2" gutterBottom>Status</Typography>
      <FormControl fullWidth size="small">
        <InputLabel>Status</InputLabel>
        <Select
          value={localFilters.status || 'all'}
          onChange={(e) => handleChange('status', e.target.value)}
          label="Status"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </Select>
      </FormControl>
    </Box>

    {/* Region */}
    <Box>
      <Typography variant="subtitle2" gutterBottom>Region</Typography>
      <Autocomplete
        options={regions}
        getOptionLabel={(option) => option.name || option}
        value={regions.find(r => r.name === localFilters.masteredRegionName) || null}
        onChange={(_, newValue) => handleChange('masteredRegionName', newValue ? newValue.name : '')}
        renderInput={(params) => (
          <TextField {...params} label="Select Region" size="small" />
        )}
      />
    </Box>

    {/* City */}
    <Box>
      <Typography variant="subtitle2" gutterBottom>City</Typography>
      <Autocomplete
        options={cities}
        getOptionLabel={(option) => option.name || option}
        value={cities.find(c => c.name === localFilters.masteredCityName) || null}
        onChange={(_, newValue) => handleChange('masteredCityName', newValue ? newValue.name : '')}
        renderInput={(params) => (
          <TextField {...params} label="Select City" size="small" />
        )}
      />
    </Box>

    {/* Organizer */}
    <Box>
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
  </Box>
);

// Helper component to display active filters as chips
const ActiveFilterChips = ({ filters, onClear }) => {
  const activeFilters = [];
  
  if (filters.search) {
    activeFilters.push({ key: 'search', label: `"${filters.search}"` });
  }
  
  if (filters.startDate) {
    activeFilters.push({ 
      key: 'startDate', 
      label: `From: ${new Date(filters.startDate).toLocaleDateString()}` 
    });
  }
  
  if (filters.endDate) {
    activeFilters.push({ 
      key: 'endDate', 
      label: `To: ${new Date(filters.endDate).toLocaleDateString()}` 
    });
  }
  
  if (filters.masteredRegionName) {
    activeFilters.push({ key: 'region', label: filters.masteredRegionName });
  }
  
  if (filters.masteredCityName) {
    activeFilters.push({ key: 'city', label: filters.masteredCityName });
  }
  
  if (filters.status && filters.status !== 'all') {
    activeFilters.push({ key: 'status', label: `Status: ${filters.status}` });
  }
  
  if (activeFilters.length === 0) return null;
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {activeFilters.map((filter) => (
        <Chip
          key={filter.key}
          label={filter.label}
          size="small"
          onDelete={onClear}
        />
      ))}
    </Box>
  );
};

export default EventFilterPanel;