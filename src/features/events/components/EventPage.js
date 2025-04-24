'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs,
  Tab,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventFilterPanel from './EventFilterPanel';
import AllEventsTab from './tabs/AllEventsTab';
import ActiveEventsTab from './tabs/ActiveEventsTab';
import InactiveEventsTab from './tabs/InactiveEventsTab';
import FeaturedEventsTab from './tabs/FeaturedEventsTab';
import BtcImportTab from './tabs/BtcImportTab';
import useEventData from '../hooks/useEventData';
import useEventFilters from '../hooks/useEventFilters';
import { organizersApi, eventsApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';

const EventPage = () => {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';
  
  // State for tabs and UI refresh
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key for forcing re-renders
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('delete');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  
  // State for lookup data
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Use our custom hooks for event data and filtering
  const eventData = useEventData(appId);
  const eventFilters = useEventFilters(eventData.filters, eventData.setFilters);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // State for lookup data
  const [divisions, setDivisions] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Load lookup data (regions, divisions, cities, organizers, venues, categories)
  useEffect(() => {
    const loadLookupData = async () => {
      setIsLoadingLookups(true);
      try {
        // Execute API requests in parallel for better performance
        const [organizersResponse, geoResponse, venuesResponse] = await Promise.all([
          // Load organizers
          organizersApi.getOrganizers(appId, true),
          
          // Load geo hierarchy data - all regions, divisions, and cities
          fetch(`/api/geo-hierarchy?type=all&appId=${appId}`).then(res => res.json()),
          
          // Load venues data
          fetch(`/api/venues?appId=${appId}`).then(res => res.json())
        ]);
        
        // Process organizers
        setOrganizers(organizersResponse || []);
        
        // Process geo hierarchy data - regions, divisions, cities
        if (geoResponse) {
          // Extract and process geo data according to models
          
          // Process regions
          let regionsData = [];
          if (geoResponse.regions && Array.isArray(geoResponse.regions)) {
            regionsData = geoResponse.regions;
          } else if (geoResponse.data && geoResponse.data.regions && Array.isArray(geoResponse.data.regions)) {
            regionsData = geoResponse.data.regions;
          } else if (Array.isArray(geoResponse)) {
            // If it's a flat array, filter by model name or type field
            regionsData = geoResponse.filter(item => 
              item.type === 'region' || 
              item.modelType === 'MasteredRegion' || 
              (item.regionName && item.regionCode)
            );
          }
          
          // Process regions with detailed logging
          const processedRegions = regionsData.map(region => ({
            id: region._id || region.id,
            name: region.regionName || region.name || `Region ${region._id || region.id}`,
            countryId: region.masteredCountryId,
            code: region.regionCode,
            type: 'region'
          }));
          
          // Set regions silently
          setRegions(processedRegions);
          
          // Process divisions
          let divisionsData = [];
          if (geoResponse.divisions && Array.isArray(geoResponse.divisions)) {
            divisionsData = geoResponse.divisions;
          } else if (geoResponse.data && geoResponse.data.divisions && Array.isArray(geoResponse.data.divisions)) {
            divisionsData = geoResponse.data.divisions;
          } else if (Array.isArray(geoResponse)) {
            // If it's a flat array, filter by model name or type field
            divisionsData = geoResponse.filter(item => 
              item.type === 'division' || 
              item.modelType === 'MasteredDivision' || 
              (item.divisionName && item.divisionCode && item.masteredRegionId)
            );
          }
          
          // Process divisions and set them without excessive logging
          const processedDivisions = divisionsData.map(division => ({
            id: division._id || division.id,
            name: division.divisionName || division.name || `Division ${division._id || division.id}`,
            regionId: division.masteredRegionId || division.regionId,
            code: division.divisionCode,
            states: division.states,
            type: 'division'
          }));
          
          setDivisions(processedDivisions);
          
          // Process cities
          let citiesData = [];
          if (geoResponse.cities && Array.isArray(geoResponse.cities)) {
            citiesData = geoResponse.cities;
          } else if (geoResponse.data && geoResponse.data.cities && Array.isArray(geoResponse.data.cities)) {
            citiesData = geoResponse.data.cities;
          } else if (Array.isArray(geoResponse)) {
            // If it's a flat array, filter by model name or type field
            citiesData = geoResponse.filter(item => 
              item.type === 'city' || 
              item.modelType === 'masteredCity' || 
              (item.cityName && item.cityCode && item.masteredDivisionId)
            );
          }
          
          // Process cities and set them without excessive logging
          const processedCities = citiesData.map(city => ({
            id: city._id || city.id,
            name: city.cityName || city.name || `City ${city._id || city.id}`,
            divisionId: city.masteredDivisionId || city.divisionId,
            // Derive regionId from division if available
            regionId: city.masteredRegionId || city.regionId || 
                      (city.masteredDivisionId && divisionsData.find(d => 
                        d._id === city.masteredDivisionId || d.id === city.masteredDivisionId
                      )?.masteredRegionId),
            coordinates: city.coordinates || (city.location && city.location.coordinates),
            latitude: city.latitude,
            longitude: city.longitude,
            code: city.cityCode,
            isActive: city.isActive !== undefined ? city.isActive : city.active,
            type: 'city'
          }));
          
          // Log just the count of processed entities
          console.log(`Processed geo data: ${processedRegions.length} regions, ${processedDivisions.length} divisions, ${processedCities.length} cities`);
          
          setCities(processedCities);
        }
        
        // Process venues data without excessive logging
        if (venuesResponse) {
          let venuesList = [];
          if (Array.isArray(venuesResponse)) {
            venuesList = venuesResponse;
          } else if (venuesResponse.venues && Array.isArray(venuesResponse.venues)) {
            venuesList = venuesResponse.venues;
          } else if (venuesResponse.data && Array.isArray(venuesResponse.data)) {
            venuesList = venuesResponse.data;
          }
          setVenues(venuesList);
          
          // Just log the count
          console.log(`Processed ${venuesList.length} venues`);
        }
        
        // Load event categories from the API
        try {
          // Use /api/categories endpoint instead of /api/event-categories
          const categoriesResponse = await fetch(`/api/categories?appId=${appId}`);
          
          if (!categoriesResponse.ok) {
            throw new Error(`Failed to fetch categories: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
          }
          
          const data = await categoriesResponse.json();
          
          if (data && Array.isArray(data)) {
            setCategories(data);
          } else if (data && data.categories && Array.isArray(data.categories)) {
            setCategories(data.categories);
          } else {
            throw new Error('Invalid categories data format received from API');
          }
        } catch (categoryError) {
          console.error('Error fetching categories:', categoryError);
          // Don't set any fallback data, let the error propagate to the UI
          setLookupError(`Categories error: ${categoryError.message}. Please check the API.`);
        }
      } catch (error) {
        console.error('Error loading lookup data:', error);
        setLookupError(error.message || 'Failed to load event data');
      } finally {
        setIsLoadingLookups(false);
      }
    };
    
    loadLookupData();
  }, [appId]);
  
  // Handle event view
  const handleViewEvent = (eventId) => {
    console.log('View event:', eventId);
    // In a real implementation, this would navigate to the event detail page
  };
  
  // Handle event edit
  const handleEditEvent = (eventId) => {
    console.log('Edit event:', eventId);
    // In a real implementation, this would open the event edit dialog
  };
  
  // Handle event delete
  const handleDeleteEvent = (eventId) => {
    setSelectedEventId(eventId);
    setDialogType('delete');
    setDialogOpen(true);
  };
  
  // Handle event status toggle
  const handleToggleStatus = (eventId, active) => {
    setSelectedEventId(eventId);
    setDialogType(active ? 'activate' : 'deactivate');
    setDialogOpen(true);
  };
  
  // Handle dialog confirm
  const handleDialogConfirm = async () => {
    if (!selectedEventId) return;
    
    setDialogLoading(true);
    
    try {
      if (dialogType === 'delete') {
        await eventData.deleteEvent(selectedEventId);
      } else {
        const active = dialogType === 'activate';
        await eventData.toggleEventStatus(selectedEventId, active);
      }
    } catch (error) {
      console.error('Error processing event action:', error);
    } finally {
      setDialogLoading(false);
      setDialogOpen(false);
      setSelectedEventId(null);
    }
  };
  
  // Handle dialog cancel
  const handleDialogCancel = () => {
    setDialogOpen(false);
    setSelectedEventId(null);
  };
  
  // Get dialog content based on type
  const getDialogContent = () => {
    switch (dialogType) {
      case 'delete':
        return {
          title: 'Delete Event',
          content: 'Are you sure you want to delete this event? This action cannot be undone.',
          confirmText: 'Delete',
          confirmColor: 'error'
        };
      case 'activate':
        return {
          title: 'Activate Event',
          content: 'Are you sure you want to activate this event? It will be visible to users.',
          confirmText: 'Activate',
          confirmColor: 'primary'
        };
      case 'deactivate':
        return {
          title: 'Deactivate Event',
          content: 'Are you sure you want to deactivate this event? It will not be visible to users.',
          confirmText: 'Deactivate',
          confirmColor: 'warning'
        };
      default:
        return {
          title: 'Confirm Action',
          content: 'Are you sure you want to proceed with this action?',
          confirmText: 'Confirm',
          confirmColor: 'primary'
        };
    }
  };
  
  const dialogConfig = getDialogContent();
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => console.log('Create new event clicked')}
          disabled={isLoadingLookups}
        >
          Create Event
        </Button>
      </Box>
      
      {/* Loading indicator */}
      {isLoadingLookups && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography>Loading event data...</Typography>
        </Box>
      )}
      
      {/* Error display */}
      {lookupError && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          }
        >
          {lookupError}
        </Alert>
      )}
      
      {/* Filter Panel */}
      <EventFilterPanel
        filters={eventFilters.filters}
        setFilters={eventFilters.updateFilters}
        regions={regions}
        divisions={divisions}
        cities={cities}
        categories={categories}
        venues={venues}
        organizers={organizers}
        onSearch={(localFilters) => {
          setIsSearching(true);
          console.log('Search initiated with geographic filters:', {
            region: localFilters.masteredRegionName || 'Not set',
            division: localFilters.masteredDivisionName || 'Not set',
            city: localFilters.masteredCityName || 'Not set'
          });
          
          // Keep it simple with only the essential parameters
          const searchFilters = {
            ...localFilters, // Use the localFilters directly passed from EventFilterPanel
            allRecords: true,
            limit: 1000, // Set a high limit to effectively disable pagination
            explicit_search: true // Just a flag to tell backend this is an explicit search
          };
          
          // Log the raw filters to debug what's happening
          console.log('Raw search filters:', {
            region: searchFilters.masteredRegionName,
            division: searchFilters.masteredDivisionName,
            city: searchFilters.masteredCityName,
            dates: {
              start: searchFilters.startDate,
              end: searchFilters.endDate
            }
          });
          
          // Apply the updated filters
          eventData.setFilters(searchFilters);
          
          // Force a new API request with a different signature to avoid caching issues
          searchFilters._ts = Date.now(); // Add timestamp to avoid caching
          
          // Perform the search
          eventData.refreshEvents(searchFilters)
            .then(() => {
              // Check if we got any events back and show data in the UI
              const count = eventData.events ? eventData.events.length : 0;
              console.log(`Search complete: ${count} events found. Events:`, eventData.events);
              
              // Always refresh UI on search completion, whether results are found or not
              console.log('Refreshing UI components to display search results (or no results message)');
              // Increment the refresh key to force a re-render of components
              setRefreshKey(prev => prev + 1);
            })
            .catch(err => {
              console.error('Search failed:', err);
            })
            .finally(() => {
              setIsSearching(false);
            });
        }}
        onClear={eventFilters.clearFilters}
        isSearching={isSearching}
      />
      
      {/* Tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="All Events" />
          <Tab label="Active" />
          <Tab label="Inactive" />
          <Tab label="Featured" />
          <Tab label="BTC Import" />
        </Tabs>
      </Box>
      
      {/* Display error if any */}
      {eventData.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {eventData.error}
        </Alert>
      )}
      
      {/* Tab Panels - using refreshKey to force re-render when data changes */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        <AllEventsTab
          key={`all-events-${refreshKey}`} // Add refresh key to force re-render
          events={eventData.events}
          loading={eventData.loading}
          error={eventData.error}
          pagination={eventData.pagination}
          onPageChange={eventData.setPage}
          onRowsPerPageChange={eventData.setRowsPerPage}
          onView={handleViewEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onToggleStatus={handleToggleStatus}
        />
      </Box>
      
      <Box sx={{ display: tabValue === 1 ? 'block' : 'none' }}>
        <ActiveEventsTab
          key={`active-events-${refreshKey}`} // Add refresh key to force re-render
          events={eventData.events}
          loading={eventData.loading}
          error={eventData.error}
          pagination={eventData.pagination}
          onPageChange={eventData.setPage}
          onRowsPerPageChange={eventData.setRowsPerPage}
          onView={handleViewEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onToggleStatus={handleToggleStatus}
        />
      </Box>
      
      <Box sx={{ display: tabValue === 2 ? 'block' : 'none' }}>
        <InactiveEventsTab
          key={`inactive-events-${refreshKey}`} // Add refresh key to force re-render
          events={eventData.events}
          loading={eventData.loading}
          error={eventData.error}
          pagination={eventData.pagination}
          onPageChange={eventData.setPage}
          onRowsPerPageChange={eventData.setRowsPerPage}
          onView={handleViewEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onToggleStatus={handleToggleStatus}
        />
      </Box>
      
      <Box sx={{ display: tabValue === 3 ? 'block' : 'none' }}>
        <FeaturedEventsTab
          key={`featured-events-${refreshKey}`} // Add refresh key to force re-render
          events={eventData.events}
          loading={eventData.loading}
          error={eventData.error}
          pagination={eventData.pagination}
          onPageChange={eventData.setPage}
          onRowsPerPageChange={eventData.setRowsPerPage}
          onView={handleViewEvent}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
          onToggleStatus={handleToggleStatus}
        />
      </Box>
      
      <Box sx={{ display: tabValue === 4 ? 'block' : 'none' }}>
        <BtcImportTab 
          key={`btc-import-${refreshKey}`} // Add refresh key to force re-render
        />
      </Box>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogCancel}
      >
        <DialogTitle>{dialogConfig.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogConfig.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel} disabled={dialogLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDialogConfirm} 
            color={dialogConfig.confirmColor}
            variant="contained"
            disabled={dialogLoading}
          >
            {dialogLoading ? <CircularProgress size={24} /> : dialogConfig.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventPage;