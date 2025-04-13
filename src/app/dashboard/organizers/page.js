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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import { organizersApi, usersApi } from '@/lib/api-client';
import OrganizerEditForm from '@/components/organizers/OrganizerEditForm';
import OrganizerCreateForm from '@/components/organizers/OrganizerCreateForm';
import OrganizerConnectUserForm from '@/components/organizers/OrganizerConnectUserForm';

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
  const [appId, setAppId] = useState('1'); // Default to TangoTiempo
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [creatingOrganizer, setCreatingOrganizer] = useState(false);
  const [connectingOrganizer, setConnectingOrganizer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  // Fetch organizers on component mount
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setLoading(true);
        let organizersData;
        
        // Fetch based on tab
        if (tabValue === 0) { // All
          organizersData = await organizersApi.getOrganizers(appId);
        } else if (tabValue === 1) { // Active
          organizersData = await organizersApi.getOrganizers(appId, true);
        } else if (tabValue === 2) { // Inactive
          organizersData = await organizersApi.getOrganizers(appId, false);
        }
        
        // Process organizers data
        const processedOrganizers = organizersData.map(organizer => ({
          ...organizer,
          id: organizer._id, // For DataGrid key
          displayName: organizer.name || 'Unnamed Organizer',
          shortDisplayName: organizer.shortName || 'No short name',
          status: organizer.isActive ? 'Active' : 'Inactive',
          approved: organizer.isApproved ? 'Yes' : 'No',
          enabled: organizer.isEnabled ? 'Yes' : 'No',
          userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
        }));
        
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
  }, [appId, tabValue]);

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
      
      // Update organizer directly to the backend
      await organizersApi.updateOrganizer(updatedOrganizer._id, updatedOrganizer);
      
      // Refresh organizers list
      const organizersData = await organizersApi.getOrganizers(appId);
      
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
      setLoading(false);
      
      // Show success message
      alert('Organizer updated successfully!');
    } catch (error) {
      console.error('Error updating organizer:', error);
      alert(`Error updating organizer: ${error.message}`);
      setLoading(false);
    }
  };

  // Handle organizer creation
  const handleCreateOrganizerSubmit = async (newOrganizer) => {
    try {
      setLoading(true);
      
      console.log('Creating organizer:', newOrganizer);
      
      // Use the test-create endpoint for more reliable organizer creation
      const response = await axios.post('/api/organizers/test-create', {
        ...newOrganizer,
        appId
      });
      
      console.log('Organizer created:', response.data);
      
      // Refresh organizers list
      const organizersData = await organizersApi.getOrganizers(appId);
      
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
      await organizersApi.connectToUser(organizerId, firebaseUserId, appId);
      
      // Refresh organizers list
      const organizersData = await organizersApi.getOrganizers(appId);
      
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
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            variant="text"
            color="primary"
            onClick={() => handleEditOrganizer(params.row)}
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="text"
            color="secondary"
            onClick={() => handleConnectOrganizer(params.row)}
            startIcon={<LinkIcon />}
          >
            Link
          </Button>
        </Box>
      ) 
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Organizer Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateOrganizer}
        >
          Add Organizer
        </Button>
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
            appId={appId}
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