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
import useEventData from '../hooks/useEventData';
import useEventFilters from '../hooks/useEventFilters';
import { organizersApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';

const EventPage = () => {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
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
  
  // Use our custom hooks for event data and filtering
  const eventData = useEventData(appId);
  const eventFilters = useEventFilters(eventData.filters, eventData.setFilters);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Load lookup data (regions, cities, organizers)
  useEffect(() => {
    const loadLookupData = async () => {
      setIsLoadingLookups(true);
      try {
        // Load organizers
        const organizersResponse = await organizersApi.getOrganizers(appId, true);
        setOrganizers(organizersResponse || []);
        
        // For this example, we're using mock data for regions and cities
        // In a real implementation, these would be loaded from an API
        setRegions([
          { id: '1', name: 'Northeast' },
          { id: '2', name: 'Southeast' },
          { id: '3', name: 'Midwest' },
          { id: '4', name: 'Southwest' },
          { id: '5', name: 'West' },
          { id: '6', name: 'Northwest' }
        ]);
        
        setCities([
          { id: '1', name: 'New York', regionId: '1' },
          { id: '2', name: 'Boston', regionId: '1' },
          { id: '3', name: 'Philadelphia', regionId: '1' },
          { id: '4', name: 'Miami', regionId: '2' },
          { id: '5', name: 'Atlanta', regionId: '2' },
          { id: '6', name: 'Chicago', regionId: '3' },
          { id: '7', name: 'Detroit', regionId: '3' },
          { id: '8', name: 'Houston', regionId: '4' },
          { id: '9', name: 'Dallas', regionId: '4' },
          { id: '10', name: 'Los Angeles', regionId: '5' },
          { id: '11', name: 'San Francisco', regionId: '5' },
          { id: '12', name: 'Seattle', regionId: '6' },
          { id: '13', name: 'Portland', regionId: '6' }
        ]);
      } catch (error) {
        console.error('Error loading lookup data:', error);
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
        >
          Create Event
        </Button>
      </Box>
      
      {/* Filter Panel */}
      <EventFilterPanel
        filters={eventFilters.filters}
        setFilters={eventFilters.updateFilters}
        regions={regions}
        cities={cities}
        organizers={organizers}
        onSearch={eventData.refreshEvents}
        onClear={eventFilters.clearFilters}
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
        </Tabs>
      </Box>
      
      {/* Display error if any */}
      {eventData.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {eventData.error}
        </Alert>
      )}
      
      {/* Tab Panels */}
      <Box sx={{ display: tabValue === 0 ? 'block' : 'none' }}>
        <AllEventsTab
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