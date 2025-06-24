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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import organizersApi from '@/lib/api-client/organizers';
import { usersApi } from '@/lib/api-client';
import OrganizerEditForm from '@/components/organizers/OrganizerEditForm';
import OrganizerCreateForm from '@/components/organizers/OrganizerCreateForm';
import OrganizerConnectUserForm from '@/components/organizers/OrganizerConnectUserForm';
import { useAppContext } from '@/lib/AppContext';


export default function OrganizersPage() {
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentApp } = useAppContext();
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [creatingOrganizer, setCreatingOrganizer] = useState(false);
  const [connectingOrganizer, setConnectingOrganizer] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  
  // New filter states
  const [filterEnabled, setFilterEnabled] = useState('enabled'); // 'all', 'enabled', 'disabled'
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [cities, setCities] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [firebaseUsers, setFirebaseUsers] = useState({});
  

  // Fetch mastered locations when component mounts
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
        
        // Fetch cities from backend directly
        const citiesResponse = await axios.get(`${backendUrl}/api/masteredLocations/cities`, {
          params: { appId: currentApp.id, isActive: true }
        });
        setCities(citiesResponse.data.cities || []);
        
        // Fetch divisions from backend directly
        const divisionsResponse = await axios.get(`${backendUrl}/api/masteredLocations/divisions`, {
          params: { appId: currentApp.id, isActive: true }
        });
        setDivisions(divisionsResponse.data.divisions || []);
      } catch (error) {
        console.error('Error fetching mastered locations:', error);
      }
    };
    
    fetchLocations();
  }, [currentApp.id]);

  // Fetch organizers when app changes
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setLoading(true);
        const appId = currentApp.id;
        
        console.log(`Fetching organizers for AppId: ${appId}`);
        
        // Fetch all organizers with all fields for editing capability
        const organizersData = await organizersApi.getOrganizers(appId, undefined, true);
        
        console.log(`Successfully fetched ${organizersData.length} organizers`);
        
        // Fetch Firebase users if needed
        const linkedUserIds = organizersData
          .filter(org => org.linkedUserLogin)
          .map(org => org.linkedUserLogin);
        
        const firebaseUserMap = {};
        if (linkedUserIds.length > 0) {
          try {
            // Fetch all users and filter by linked IDs
            const allUsers = await usersApi.getUsers(appId);
            console.log(`Initial fetch: Got ${allUsers.length} users from UserLogins API`);
            console.log(`Looking for ${linkedUserIds.length} linked users:`, linkedUserIds);
            
            allUsers.forEach(user => {
              if (user && user._id && linkedUserIds.includes(user._id)) {
                // Build display name from available user info
                let displayName = 'Unknown User';
                
                // Try different sources for the display name
                if (user.localUserInfo?.loginUserName && user.localUserInfo.loginUserName.trim()) {
                  displayName = user.localUserInfo.loginUserName;
                } else if (user.localUserInfo?.firstName || user.localUserInfo?.lastName) {
                  const firstName = user.localUserInfo?.firstName || '';
                  const lastName = user.localUserInfo?.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  if (fullName) {
                    displayName = fullName;
                  }
                } else if (user.firebaseUserInfo?.displayName && user.firebaseUserInfo.displayName.trim()) {
                  displayName = user.firebaseUserInfo.displayName;
                } else if (user.firebaseUserInfo?.email) {
                  displayName = user.firebaseUserInfo.email;
                } else if (user.email) {
                  displayName = user.email;
                }
                
                firebaseUserMap[user._id] = displayName || 'Unknown User';
              }
            });
          } catch (error) {
            console.warn('Error fetching user data:', error);
          }
        }
        
        // Log any missing users
        const missingUsers = linkedUserIds.filter(id => !firebaseUserMap[id]);
        if (missingUsers.length > 0) {
          console.warn(`Could not find ${missingUsers.length} linked users:`, missingUsers);
        }
        
        setFirebaseUsers(firebaseUserMap);
        
        // Process organizers data
        const processedOrganizers = organizersData.map(organizer => ({
          ...organizer,
          id: organizer._id, // For DataGrid key
          displayName: organizer.fullName || organizer.name || 'Unnamed Organizer',
          shortDisplayName: organizer.shortName || 'No short name',
          status: organizer.isActive ? 'Active' : 'Inactive',
          wantRender: organizer.wantRender ? 'Yes' : 'No',
          isRendered: organizer.isRendered ? 'Yes' : 'No',
          enabled: organizer.isEnabled ? 'Yes' : 'No',
          userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
          linkedUserLogin: organizer.linkedUserLogin, // Store the ID for column renderer
          userConnectedName: organizer.linkedUserLogin ? firebaseUserMap[organizer.linkedUserLogin] || null : '-',
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
  }, [currentApp.id]);


  // Refresh organizers data and update state
  const refreshOrganizersData = async () => {
    try {
      // Fetch organizers with all fields
      const organizersData = await organizersApi.getOrganizers(currentApp.id, undefined, true);
      
      // Fetch Firebase users for linked organizers
      const linkedUserIds = organizersData
        .filter(org => org.linkedUserLogin)
        .map(org => org.linkedUserLogin);
      
      const firebaseUserMap = {};
      if (linkedUserIds.length > 0) {
        try {
          const allUsers = await usersApi.getUsers(currentApp.id);
          console.log(`Fetched ${allUsers.length} users from UserLogins API`);
          
          allUsers.forEach(user => {
            if (user && user._id && linkedUserIds.includes(user._id)) {
              let displayName = 'Unknown User';
              
              // Try different sources for the display name
              if (user.localUserInfo?.loginUserName && user.localUserInfo.loginUserName.trim()) {
                displayName = user.localUserInfo.loginUserName;
              } else if (user.localUserInfo?.firstName || user.localUserInfo?.lastName) {
                const firstName = user.localUserInfo?.firstName || '';
                const lastName = user.localUserInfo?.lastName || '';
                const fullName = `${firstName} ${lastName}`.trim();
                if (fullName) {
                  displayName = fullName;
                }
              } else if (user.firebaseUserInfo?.displayName && user.firebaseUserInfo.displayName.trim()) {
                displayName = user.firebaseUserInfo.displayName;
              } else if (user.firebaseUserInfo?.email) {
                displayName = user.firebaseUserInfo.email;
              } else if (user.email) {
                displayName = user.email;
              }
              
              firebaseUserMap[user._id] = displayName || 'Unknown User';
            }
          });
        } catch (error) {
          console.warn('Error fetching user data:', error);
        }
      }
      
      setFirebaseUsers(firebaseUserMap);
      
      // Process organizers data
      const processedOrganizers = organizersData.map(organizer => ({
        ...organizer,
        id: organizer._id,
        displayName: organizer.fullName || organizer.name || 'Unnamed Organizer',
        shortDisplayName: organizer.shortName || 'No short name',
        status: organizer.isActive ? 'Active' : 'Inactive',
        wantRender: organizer.wantRender ? 'Yes' : 'No',
        isRendered: organizer.isRendered ? 'Yes' : 'No',
        enabled: organizer.isEnabled ? 'Yes' : 'No',
        userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
        linkedUserLogin: organizer.linkedUserLogin, // Store the ID for column renderer
        userConnectedName: organizer.linkedUserLogin ? firebaseUserMap[organizer.linkedUserLogin] || null : '-',
      }));
      
      setOrganizers(processedOrganizers);
      setFilteredOrganizers(processedOrganizers);
      
      return processedOrganizers;
    } catch (error) {
      console.error('Error refreshing organizers:', error);
      throw error;
    }
  };

  // Handle search input change
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };
  
  // Apply filters whenever any filter changes
  useEffect(() => {
    filterOrganizers();
  }, [searchTerm, filterEnabled, selectedCityId, selectedDivisionId, organizers]);

  // Filter organizers based on all filters
  const filterOrganizers = () => {
    let filtered = [...organizers];
    
    // Apply search term filter
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(organizer =>
        (organizer.displayName.toLowerCase().includes(lowerTerm)) ||
        (organizer.shortDisplayName.toLowerCase().includes(lowerTerm))
      );
    }
    
    // Apply enabled filter
    if (filterEnabled === 'enabled') {
      filtered = filtered.filter(organizer => organizer.isEnabled === true);
    } else if (filterEnabled === 'disabled') {
      filtered = filtered.filter(organizer => organizer.isEnabled === false);
    }
    // If filterEnabled is 'all', don't filter by isEnabled
    
    // Apply city filter
    if (selectedCityId) {
      filtered = filtered.filter(organizer => 
        organizer.masteredCityId === selectedCityId
      );
    }
    
    // Apply division filter
    if (selectedDivisionId) {
      filtered = filtered.filter(organizer => 
        organizer.masteredDivisionId === selectedDivisionId
      );
    }
    
    setFilteredOrganizers(filtered);
  };

  // Handle edit organizer button click
  const handleEditOrganizer = (organizer) => {
    console.log('handleEditOrganizer called with:', organizer);
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
      
      // Use organizersApi to call backend directly with all fields
      const organizersData = await organizersApi.getOrganizers(currentApp.id, undefined, true);
      
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
        const deleteResponse = await organizersApi.deleteOrganizer(organizer._id, currentApp.id);
        console.log('Delete response:', deleteResponse);
        
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
      
      // Use the organizersApi to update
      const response = await organizersApi.updateOrganizer(
        updatedOrganizer._id, 
        updatedOrganizer
      );
      
      console.log('Update successful:', response);
      
      // Refresh all organizers data
      await refreshOrganizersData();
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
      console.log('Current app ID:', currentApp.id);
      
      // Use the organizers API for reliable organizer creation
      const response = await organizersApi.createOrganizer({
        ...newOrganizer,
        appId: currentApp.id
      });
      
      console.log('Organizer created successfully, response:', response);
      
      // Refresh all organizers data
      console.log('Refreshing organizers data...');
      await refreshOrganizersData();
      console.log('Organizers data refreshed');
      
      setCreateDialogOpen(false);
      setCreatingOrganizer(false);
      setLoading(false);
      
      // Show success message
      alert('Organizer created successfully!');
    } catch (error) {
      console.error('Error creating organizer:', error);
      console.error('Error stack:', error.stack);
      let errorMessage = error.message;
      
      if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
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
      
      // Refresh all organizers data
      await refreshOrganizersData();
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
    { 
      field: 'displayName', 
      headerName: 'Name', 
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '220px' 
          }}>
            {params.value.substring(0, 30)}
          </span>
          <FiberManualRecordIcon 
            sx={{ 
              fontSize: 10, 
              color: params.row.isActive ? 'success.main' : 'grey.400' 
            }} 
          />
        </Box>
      )
    },
    { 
      field: 'shortDisplayName', 
      headerName: 'Short Name', 
      width: 150,
      renderCell: (params) => (
        <span>{params.value.substring(0, 15)}</span>
      )
    },
    { 
      field: 'enabled', 
      headerName: 'Enabled', 
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => 
        params.row.isEnabled ? 
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} /> : 
          <CancelIcon sx={{ color: 'error.main', fontSize: 20 }} />
    },
    { 
      field: 'wantRender', 
      headerName: 'Render', 
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => 
        params.row.wantRender ? 
          <CheckCircleIcon sx={{ color: 'info.main', fontSize: 20 }} /> : 
          <CancelIcon sx={{ color: 'grey.400', fontSize: 20 }} />
    },
    { 
      field: 'isRendered', 
      headerName: 'Rendered', 
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => 
        params.row.isRendered ? 
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} /> : 
          <CancelIcon sx={{ color: 'grey.400', fontSize: 20 }} />
    },
    { 
      field: 'organizerTypes', 
      headerName: 'Types', 
      width: 150,
      renderCell: (params) => {
        const types = [];
        if (params.row.organizerTypes?.isVenue) types.push('Venue');
        if (params.row.organizerTypes?.isTeacher) types.push('Teacher');
        if (params.row.organizerTypes?.isMaestro) types.push('Maestro');
        if (params.row.organizerTypes?.isDJ) types.push('DJ');
        if (params.row.organizerTypes?.isOrchestra) types.push('Orchestra');
        return (
          <span style={{ fontSize: '0.85em' }}>
            {types.length > 0 ? types.join(', ') : 'Event Only'}
          </span>
        );
      }
    },
    { 
      field: 'userConnectedName', 
      headerName: 'Connected User', 
      width: 150,
      renderCell: (params) => {
        // No linked user
        if (!params.row.linkedUserLogin) {
          return <span>-</span>;
        }
        
        // Try to get the name from the processed value first
        if (params.value && params.value !== '-') {
          return <span>{params.value}</span>;
        }
        
        // If no processed value, try to find it in firebaseUsers state
        const userName = firebaseUsers[params.row.linkedUserLogin];
        if (userName) {
          return <span>{userName}</span>;
        }
        
        // Still loading
        return <span style={{ color: 'gray', fontStyle: 'italic' }}>Not found</span>;
      }
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            color="primary"
            onClick={() => handleEditOrganizer(params.row)}
            size="small"
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="secondary"
            onClick={() => handleConnectOrganizer(params.row)}
            size="small"
            title="Link User"
          >
            <LinkIcon fontSize="small" />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteOrganizer(params.row)}
            size="small"
            title="Delete"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
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
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search organizers..."
            value={searchTerm}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            sx={{ minWidth: 250 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }
            }}
          />
          
          <ToggleButtonGroup
            value={filterEnabled}
            exclusive
            onChange={(event, newValue) => {
              if (newValue !== null) {
                setFilterEnabled(newValue);
              }
            }}
            size="small"
            sx={{ height: 40 }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="enabled">Enabled</ToggleButton>
            <ToggleButton value="disabled">Disabled</ToggleButton>
          </ToggleButtonGroup>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>City</InputLabel>
            <Select 
              value={selectedCityId} 
              onChange={(e) => setSelectedCityId(e.target.value)}
              label="City"
            >
              <MenuItem value="">All Cities</MenuItem>
              {cities.map(city => (
                <MenuItem key={city._id} value={city._id}>
                  {city.cityName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Division</InputLabel>
            <Select 
              value={selectedDivisionId} 
              onChange={(e) => setSelectedDivisionId(e.target.value)}
              label="Division"
            >
              <MenuItem value="">All Divisions</MenuItem>
              {divisions.map(division => (
                <MenuItem key={division._id} value={division._id}>
                  {division.divisionName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      
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