'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import DeleteIcon from '@mui/icons-material/Delete';
import { organizersApi, usersApi } from '@/lib/api-client';
import OrganizerEditForm from '@/components/organizers/OrganizerEditForm';
import OrganizerCreateForm from '@/components/organizers/OrganizerCreateForm';
import OrganizerConnectUserForm from '@/components/organizers/OrganizerConnectUserForm';
import { useAppContext } from '@/lib/AppContext';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function OrganizersPage() {
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const { currentApp } = useAppContext();
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [creatingOrganizer, setCreatingOrganizer] = useState(false);
  const [connectingOrganizer, setConnectingOrganizer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  

  // Fetch organizers when tab or app changes
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setLoading(true);
        let organizersData;
        const appId = currentApp.id;
        
        console.log(`Fetching organizers for AppId: ${appId}, Tab: ${tabValue}`);
        
        // Fetch based on tab
        if (tabValue === 0) { // All
          organizersData = await organizersApi.getOrganizers(appId);
        } else if (tabValue === 1) { // Active
          organizersData = await organizersApi.getOrganizers(appId, true);
        } else if (tabValue === 2) { // Inactive
          organizersData = await organizersApi.getOrganizers(appId, false);
        }
        
        console.log(`Successfully fetched ${organizersData.length} organizers`);
        
        // Process organizers data
        const processedOrganizers = organizersData.map(organizer => ({
          ...organizer,
          id: organizer._id, // For DataGrid key
          displayName: organizer.fullName || organizer.name || 'Unnamed Organizer',
          shortDisplayName: organizer.shortName || 'No short name',
          status: organizer.isActive ? 'Active' : 'Inactive',
          approved: organizer.isApproved ? 'Yes' : 'No',
          enabled: organizer.isEnabled ? 'Yes' : 'No',
          userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
        }));
        
        console.log(`Processed ${processedOrganizers.length} organizers successfully`);
        setOrganizers(processedOrganizers);
        setFilteredOrganizers(processedOrganizers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching organizers:', error);
        setLoading(false);
        alert(`Failed to fetch organizers: ${error.message}`);
      }
    };

    fetchOrganizers();
  }, [currentApp.id, tabValue]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    filterOrganizers(term);
  };

  // Filter organizers based on search term
  const filterOrganizers = (term) => {
    if (!term) {
      setFilteredOrganizers(organizers);
      return;
    }
    
    const lowerTerm = term.toLowerCase();
    const filtered = organizers.filter(organizer =>
      (organizer.displayName.toLowerCase().includes(lowerTerm)) ||
      (organizer.shortDisplayName.toLowerCase().includes(lowerTerm))
    );
    
    setFilteredOrganizers(filtered);
  };

  // Handle edit organizer button click
  const handleEditOrganizer = (organizer) => {
    setEditingOrganizer(organizer);
    setDialogOpen(true);
  };

  // Handle connect organizer to user button click
  const handleConnectOrganizer = (organizer) => {
    setConnectingOrganizer(organizer);
    setConnectDialogOpen(true);
  };
  
  // Function to refresh organizers
  const refreshOrganizers = async () => {
    try {
      // Fetch organizers with a cache-busting parameter
      const timestamp = new Date().getTime();
      console.log(`Refreshing organizers at ${timestamp}...`);
      
      // Use direct API call to bypass caching
      const response = await axios.get(`/api/organizers?appId=${currentApp.id}&_=${timestamp}`);
      const organizersData = response.data;
      
      // Check if organizersData is an array
      if (!Array.isArray(organizersData)) {
        console.error('Expected array of organizers, got:', typeof organizersData);
        // If not an array, try to fetch again using the organizersApi client
        const apiResponse = await organizersApi.getOrganizers(currentApp.id);
        if (Array.isArray(apiResponse)) {
          console.log('Successfully retrieved organizers using api client');
          const processedOrganizers = apiResponse.map(org => ({
            ...org,
            id: org._id,
            displayName: org.name || 'Unnamed Organizer',
            shortDisplayName: org.shortName || 'No short name',
            status: org.isActive ? 'Active' : 'Inactive',
            approved: org.isApproved ? 'Yes' : 'No',
            enabled: org.isEnabled ? 'Yes' : 'No',
            userConnected: org.linkedUserLogin ? 'Yes' : 'No',
          }));
          
          console.log(`Refreshed ${processedOrganizers.length} organizers`);
          setOrganizers(processedOrganizers);
          return processedOrganizers;
        }
        
        // If both methods fail, return an empty array as fallback
        console.warn('Failed to get organizers data, returning empty array');
        setOrganizers([]);
        return [];
      }
      
      // Process organizers data
      const processedOrganizers = organizersData.map(org => ({
        ...org,
        id: org._id,
        displayName: org.name || 'Unnamed Organizer',
        shortDisplayName: org.shortName || 'No short name',
        status: org.isActive ? 'Active' : 'Inactive',
        approved: org.isApproved ? 'Yes' : 'No',
        enabled: org.isEnabled ? 'Yes' : 'No',
        userConnected: org.linkedUserLogin ? 'Yes' : 'No',
      }));
      
      console.log(`Refreshed ${processedOrganizers.length} organizers`);
      setOrganizers(processedOrganizers);
      return processedOrganizers;
    } catch (error) {
      console.error('Error refreshing organizers:', error);
      // Return empty array instead of throwing to avoid crashing the UI
      setOrganizers([]);
      return [];
    }
  };

  // Handle delete organizer
  const handleDeleteOrganizer = async (organizer) => {
    try {
      // Get confirmation
      if (!window.confirm(`Are you sure you want to delete the organizer "${organizer.displayName}"?\nThis action cannot be undone.`)) {
        return;
      }
      
      setLoading(true);
      
      // First, check if this organizer is connected to a user
      if (organizer.linkedUserLogin) {
        try {
          // Find which user is connected to this organizer
          const users = await usersApi.getUsers(currentApp.id);
          const connectedUser = users.find(user => 
            user.regionalOrganizerInfo?.organizerId === organizer._id ||
            (typeof user.regionalOrganizerInfo?.organizerId === 'object' && 
             user.regionalOrganizerInfo?.organizerId._id === organizer._id)
          );
          
          if (connectedUser) {
            // Disconnect organizer from user
            const userUpdateData = {
              firebaseUserId: connectedUser.firebaseUserId,
              appId: connectedUser.appId || currentApp.id,
              regionalOrganizerInfo: {
                ...connectedUser.regionalOrganizerInfo,
                organizerId: null,
                isApproved: false,
                isEnabled: false,
                isActive: false
              }
            };
            
            // Update user to remove organizer connection
            await usersApi.updateUser(userUpdateData);
            console.log(`Successfully disconnected user ${connectedUser.firebaseUserId} from organizer`);
          }
        } catch (userError) {
          console.warn('Error handling user connection:', userError);
          // Continue with deletion even if user disconnect fails
        }
      }
      
      try {
        // Delete the organizer using the API
        const deleteResponse = await axios.delete(`/api/organizers/${organizer._id}?appId=${currentApp.id}`);
        console.log('Delete response:', deleteResponse.data);
        
        // Force a delay before refreshing to allow server-side propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Use the organizersApi client directly for more reliable fetching
          const organizersData = await organizersApi.getOrganizers(currentApp.id);
          
          // Process organizers data
          const processedOrganizers = organizersData.map(org => ({
            ...org,
            id: org._id,
            displayName: org.name || 'Unnamed Organizer',
            shortDisplayName: org.shortName || 'No short name',
            status: org.isActive ? 'Active' : 'Inactive',
            approved: org.isApproved ? 'Yes' : 'No',
            enabled: org.isEnabled ? 'Yes' : 'No',
            userConnected: org.linkedUserLogin ? 'Yes' : 'No',
          }));
          
          console.log(`Got ${processedOrganizers.length} organizers after deletion`);
          setOrganizers(processedOrganizers);
          
          // Apply any current filters
          filterOrganizers(searchTerm);
        } catch (refreshError) {
          console.error('Error refreshing organizers after deletion:', refreshError);
          // Fallback to our refreshOrganizers function
          await refreshOrganizers();
        }
        
        // Set a short timeout to reapply filters (sometimes needed for UI refresh)
        setTimeout(() => {
          filterOrganizers(searchTerm);
        }, 100);
        
        alert('Organizer deleted successfully!');
      } catch (deleteError) {
        console.error('Error during actual deletion:', deleteError);
        throw deleteError; // Re-throw for the outer catch
      }
    } catch (error) {
      console.error('Error deleting organizer:', error);
      let errorMessage = error.message;
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || error.response.data.details || error.message;
      }
      
      alert(`Error deleting organizer: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle create organizer button click
  const handleCreateOrganizer = () => {
    setCreatingOrganizer(true);
    setCreateDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingOrganizer(null);
  };

  // Handle create dialog close
  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setCreatingOrganizer(false);
  };

  // Handle connect dialog close
  const handleConnectDialogClose = () => {
    setConnectDialogOpen(false);
    setConnectingOrganizer(null);
  };
  
  

  // Handle organizer update
  const handleUpdateOrganizer = async (updatedOrganizer) => {
    try {
      setLoading(true);
      
      console.log('Updating organizer:', updatedOrganizer);
      
      // Make sure we have the appId in the updatedOrganizer and ensure boolean fields are properly set
      const organizerWithAppId = {
        ...updatedOrganizer,
        appId: updatedOrganizer.appId || currentApp.id,
        // Ensure both name fields are set consistently
        name: updatedOrganizer.name,
        fullName: updatedOrganizer.name,
        shortName: updatedOrganizer.shortName || updatedOrganizer.name,
        // Explicitly convert boolean fields with ternary to ensure true/false values
        isApproved: updatedOrganizer.isApproved === true ? true : false,
        isActive: updatedOrganizer.isActive === true ? true : false,
        isEnabled: updatedOrganizer.isEnabled === true ? true : false
      };
      
      console.log('Formatted organizer for update:', organizerWithAppId);
      
      // Try direct update via axios instead of the api-client
      try {
        // First log what we're attempting to do
        console.log(`Directly updating organizer ${organizerWithAppId._id} with appId ${organizerWithAppId.appId}`);
        
        const response = await axios.patch(
          `/api/organizers/${organizerWithAppId._id}?appId=${organizerWithAppId.appId}`, 
          organizerWithAppId
        );
        
        console.log('Update successful:', response.data);
      } catch (axiosError) {
        console.error('Direct PATCH failed:', axiosError);
        console.log('Falling back to direct PUT to backend...');
        
        // If that fails, try to use the backend API directly
        const directResponse = await axios.put(
          `${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010'}/api/organizers/${organizerWithAppId._id}?appId=${organizerWithAppId.appId}`,
          organizerWithAppId
        );
        
        console.log('Direct PUT to backend successful:', directResponse.data);
      }
      
      // Refresh organizers list
      const organizersData = await organizersApi.getOrganizers(currentApp.id);
      
      // Process organizers data
      const processedOrganizers = organizersData.map(organizer => ({
        ...organizer,
        id: organizer._id,
        displayName: organizer.name || 'Unnamed Organizer',
        shortDisplayName: organizer.shortName || 'No short name',
        status: organizer.isActive ? 'Active' : 'Inactive',
        approved: organizer.isApproved ? 'Yes' : 'No',
        enabled: organizer.isEnabled ? 'Yes' : 'No',
        userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
      }));
      
      setOrganizers(processedOrganizers);
      filterOrganizers(searchTerm);
      setDialogOpen(false);
      setEditingOrganizer(null);
      
      // Show success message
      alert('Organizer updated successfully!');
    } catch (error) {
      console.error('Error updating organizer:', error);
      
      // More detailed error reporting
      let errorMessage = 'Failed to update organizer';
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage += `: ${error.response.status} - ${JSON.stringify(error.response.data || error.message)}`;
      } else {
        errorMessage += `: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle organizer creation
  const handleCreateOrganizerSubmit = async (newOrganizer) => {
    try {
      setLoading(true);
      
      console.log('Creating organizer:', newOrganizer);
      
      // Use the organizers API for reliable organizer creation
      const response = await organizersApi.createOrganizer({
        ...newOrganizer,
        appId: currentApp.id
      });
      
      console.log('Organizer created:', response.data);
      
      // Refresh organizers list
      const organizersData = await organizersApi.getOrganizers(currentApp.id);
      
      // Process organizers data
      const processedOrganizers = organizersData.map(organizer => ({
        ...organizer,
        id: organizer._id,
        displayName: organizer.fullName || organizer.name || 'Unnamed Organizer',
        shortDisplayName: organizer.shortName || 'No short name',
        status: organizer.isActive ? 'Active' : 'Inactive',
        approved: organizer.isApproved ? 'Yes' : 'No',
        enabled: organizer.isEnabled ? 'Yes' : 'No',
        userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
      }));
      
      setOrganizers(processedOrganizers);
      filterOrganizers(searchTerm);
      setCreateDialogOpen(false);
      setCreatingOrganizer(false);
      setLoading(false);
      
      // Show success message
      alert('Organizer created successfully!');
    } catch (error) {
      console.error('Error creating organizer:', error);
      let errorMessage = error.message;
      
      if (error.response && error.response.data) {
        console.error('Error details:', error.response.data);
        errorMessage = error.response.data.details || error.response.data.error || error.message;
      }
      
      alert(`Error creating organizer: ${errorMessage}`);
      setLoading(false);
    }
  };

  // Handle connect organizer to user
  const handleConnectUser = async (organizerId, firebaseUserId) => {
    try {
      setLoading(true);
      
      console.log('Connecting organizer to user:', { organizerId, firebaseUserId });
      
      // Connect organizer to user
      await organizersApi.connectToUser(organizerId, firebaseUserId, currentApp.id);
      
      // Refresh organizers list
      const organizersData = await organizersApi.getOrganizers(currentApp.id);
      
      // Process organizers data
      const processedOrganizers = organizersData.map(organizer => ({
        ...organizer,
        id: organizer._id,
        displayName: organizer.name || 'Unnamed Organizer',
        shortDisplayName: organizer.shortName || 'No short name',
        status: organizer.isActive ? 'Active' : 'Inactive',
        approved: organizer.isApproved ? 'Yes' : 'No',
        enabled: organizer.isEnabled ? 'Yes' : 'No',
        userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
      }));
      
      setOrganizers(processedOrganizers);
      filterOrganizers(searchTerm);
      setConnectDialogOpen(false);
      setConnectingOrganizer(null);
      setLoading(false);
      
      // Show success message
      alert('Organizer connected to user successfully!');
    } catch (error) {
      console.error('Error connecting organizer to user:', error);
      alert(`Error connecting organizer to user: ${error.message}`);
      setLoading(false);
    }
  };

  // Define columns for DataGrid
  const columns = [
    { field: 'displayName', headerName: 'Name', flex: 1 },
    { field: 'shortDisplayName', headerName: 'Short Name', flex: 1 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'approved', headerName: 'Approved', width: 120 },
    { field: 'enabled', headerName: 'Enabled', width: 120 },
    { field: 'userConnected', headerName: 'User Connected', width: 150 },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 300,
      renderCell: (params) => (
        <Box>
          <Button
            variant="text"
            color="primary"
            onClick={() => handleEditOrganizer(params.row)}
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
            size="small"
          >
            Edit
          </Button>
          <Button
            variant="text"
            color="secondary"
            onClick={() => handleConnectOrganizer(params.row)}
            startIcon={<LinkIcon />}
            sx={{ mr: 1 }}
            size="small"
          >
            Link
          </Button>
          <Button
            variant="text"
            color="error"
            onClick={() => handleDeleteOrganizer(params.row)}
            startIcon={<DeleteIcon />}
            size="small"
          >
            Delete
          </Button>
        </Box>
      ) 
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Organizer Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleCreateOrganizer}
          >
            Add Organizer
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Organizers" />
          <Tab label="Active" />
          <Tab label="Inactive" />
        </Tabs>
        
        <TextField
          placeholder="Search organizers..."
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
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredOrganizers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              density="standard"
            />
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredOrganizers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              density="standard"
            />
          )}
        </Paper>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ height: 600, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredOrganizers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              density="standard"
            />
          )}
        </Paper>
      </TabPanel>
      
      {/* Organizer Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Edit Organizer</DialogTitle>
        <DialogContent>
          {editingOrganizer && (
            <OrganizerEditForm
              organizer={editingOrganizer}
              onSubmit={handleUpdateOrganizer}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Organizer Create Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCreateDialogClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Create New Organizer</DialogTitle>
        <DialogContent>
          <OrganizerCreateForm
            onSubmit={handleCreateOrganizerSubmit}
            appId={currentApp.id}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Organizer Connect User Dialog */}
      <Dialog 
        open={connectDialogOpen} 
        onClose={handleConnectDialogClose} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Connect Organizer to User</DialogTitle>
        <DialogContent>
          {connectingOrganizer && (
            <OrganizerConnectUserForm
              organizer={connectingOrganizer}
              onSubmit={(firebaseUserId) => handleConnectUser(connectingOrganizer._id, firebaseUserId)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConnectDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
    </Box>
  );
}