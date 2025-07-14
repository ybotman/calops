'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  InputAdornment,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import organizersApi from '@/lib/api-client/organizers';
import { usersApi } from '@/lib/api-client';
import { useAppContext } from '@/lib/AppContext';

export default function OrganizerTypeManagement({ typeFilter, pageTitle, typeLabel }) {
  const [loading, setLoading] = useState(true);
  const [organizers, setOrganizers] = useState([]);
  const [filteredOrganizers, setFilteredOrganizers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentApp } = useAppContext();
  const [filterEnabled, setFilterEnabled] = useState('all');
  const [firebaseUsers, setFirebaseUsers] = useState({});

  // Fetch organizers when app changes
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        setLoading(true);
        const appId = currentApp.id;
        
        // Fetch all organizers with all fields
        const organizersData = await organizersApi.getOrganizers(appId, undefined, true, true);
        
        // Filter by type based on typeFilter prop
        const typeFilterMap = {
          'dj': 'isDJ',
          'teacher': 'isTeacher',
          'orchestra': 'isOrchestra',
          'venue': 'isVenue'
        };
        
        const filterField = typeFilterMap[typeFilter];
        const typeFilteredOrganizers = organizersData.filter(org => 
          org.organizerTypes && org.organizerTypes[filterField] === true
        );
        
        // Fetch Firebase users for linked organizers
        const linkedUserIds = typeFilteredOrganizers
          .filter(org => org.linkedUserLogin)
          .map(org => org.linkedUserLogin);
        
        const firebaseUserMap = {};
        if (linkedUserIds.length > 0) {
          try {
            const allUsers = await usersApi.getUsers(appId);
            allUsers.forEach(user => {
              if (user && user._id && linkedUserIds.includes(user._id)) {
                let displayName = 'Unknown User';
                
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
        const processedOrganizers = typeFilteredOrganizers.map(organizer => ({
          ...organizer,
          id: organizer._id,
          displayName: organizer.fullName || organizer.name || 'Unnamed Organizer',
          shortDisplayName: organizer.shortName || 'No short name',
          status: organizer.isActive ? 'Active' : 'Inactive',
          enabled: organizer.isEnabled ? 'Yes' : 'No',
          visible: organizer.isVisible ? 'Yes' : 'No',
          userConnected: organizer.linkedUserLogin ? 'Yes' : 'No',
          linkedUserLogin: organizer.linkedUserLogin,
          userConnectedName: organizer.linkedUserLogin ? firebaseUserMap[organizer.linkedUserLogin] || null : '-',
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
  }, [currentApp.id, typeFilter]);

  // Handle search input change
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
  };
  
  // Apply filters whenever any filter changes
  useEffect(() => {
    filterOrganizers();
  }, [searchTerm, filterEnabled, organizers]);

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
    
    setFilteredOrganizers(filtered);
  };

  // Define columns for DataGrid (without actions)
  const columns = [
    { 
      field: 'displayName', 
      headerName: 'Name', 
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            maxWidth: '270px' 
          }}>
            {params.value}
          </span>
          {params.row.isActive ? 
            <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} /> : 
            <CancelIcon sx={{ fontSize: 16, color: 'error.main' }} />
          }
        </Box>
      )
    },
    { 
      field: 'shortDisplayName', 
      headerName: 'Short Name', 
      width: 200,
      renderCell: (params) => (
        <span>{params.value}</span>
      )
    },
    { 
      field: 'enabled', 
      headerName: 'Enabled', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => 
        params.row.isEnabled ? 
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} /> : 
          <CancelIcon sx={{ color: 'error.main', fontSize: 20 }} />
    },
    { 
      field: 'visible', 
      headerName: 'Visible', 
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => 
        params.row.isVisible ? 
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} /> : 
          <CancelIcon sx={{ color: 'grey.400', fontSize: 20 }} />
    },
    { 
      field: 'userConnectedName', 
      headerName: 'Connected User', 
      width: 250,
      renderCell: (params) => {
        if (!params.row.linkedUserLogin) {
          return <span>-</span>;
        }
        
        if (params.value && params.value !== '-') {
          return <span>{params.value}</span>;
        }
        
        const userName = firebaseUsers[params.row.linkedUserLogin];
        if (userName) {
          return <span>{userName}</span>;
        }
        
        return <span style={{ color: 'gray', fontStyle: 'italic' }}>Not found</span>;
      }
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{pageTitle}</Typography>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder={`Search ${typeLabel.toLowerCase()}s...`}
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
        </Box>
      </Box>
      
      <Paper sx={{ height: 600, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : filteredOrganizers.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Alert severity="info">
              No {typeLabel.toLowerCase()}s found.
            </Alert>
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
    </Box>
  );
}