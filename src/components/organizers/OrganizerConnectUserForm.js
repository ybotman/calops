'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Autocomplete,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { usersApi, organizersApi } from '@/lib/api-client';

export default function OrganizerConnectUserForm({ organizer, onSubmit }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [alternateUsers, setAlternateUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUserLoading(true);
        // Get users from the backend
        const userData = await usersApi.getUsers(organizer.appId, true);
        setUsers(userData);
        
        // If organizer has a linked user, load their alternate Firebase IDs and set as selected
        if (organizer.linkedUserLogin) {
          const linkedUser = userData.find(u => u._id === organizer.linkedUserLogin);
          if (linkedUser) {
            // Set the linked user as selected
            setSelectedUser(linkedUser);
            setSelectedUserId(linkedUser.firebaseUserId);
            
            // Load alternate users if they exist
            if (linkedUser.alternateFirebaseUserIds?.length > 0) {
              // Find users matching the alternate Firebase IDs
              const altUsers = userData.filter(u => 
                linkedUser.alternateFirebaseUserIds.includes(u.firebaseUserId)
              );
              setAlternateUsers(altUsers);
            }
          }
        }
        
        setUserLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        setUserLoading(false);
      }
    };

    fetchUsers();
  }, [organizer.appId, organizer.linkedUserLogin]);

  // Handle user selection
  const handleUserChange = (event, newValue) => {
    setSelectedUser(newValue);
    setSelectedUserId(newValue?.firebaseUserId || '');
  };

  // Filter users for Autocomplete
  const filterOptions = (options, { inputValue }) => {
    const filterValue = inputValue.toLowerCase().trim();
    return options.filter((option) => {
      const firstName = (option.localUserInfo?.firstName || '').toLowerCase();
      const lastName = (option.localUserInfo?.lastName || '').toLowerCase();
      const loginUserName = (option.localUserInfo?.loginUserName || '').toLowerCase();
      const displayName = (option.firebaseUserInfo?.displayName || '').toLowerCase();
      const email = (option.firebaseUserInfo?.email || option.email || '').toLowerCase();
      const userId = (option.firebaseUserId || '').toLowerCase();
      
      return (
        firstName.includes(filterValue) ||
        lastName.includes(filterValue) ||
        loginUserName.includes(filterValue) ||
        displayName.includes(filterValue) ||
        email.includes(filterValue) ||
        userId.includes(filterValue)
      );
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    setLoading(true);
    
    try {
      // Submit the primary user connection
      await onSubmit(selectedUserId);
      
      // If we have a selected user and alternate users, update the alternate Firebase IDs
      if (selectedUser && alternateUsers.length > 0) {
        const alternateFirebaseIds = alternateUsers.map(u => u.firebaseUserId);
        
        try {
          // Check if the function exists before calling it
          if (typeof usersApi.updateAlternateFirebaseIds === 'function') {
            // Update the user's alternate Firebase IDs
            await usersApi.updateAlternateFirebaseIds(selectedUser.firebaseUserId, alternateFirebaseIds);
            console.log('Updated alternate Firebase IDs:', alternateFirebaseIds);
          } else {
            console.warn('updateAlternateFirebaseIds function not available - skipping alternate IDs update');
          }
        } catch (altError) {
          console.error('Error updating alternate Firebase IDs:', altError);
          // Don't fail the whole operation if alternate IDs fail
        }
      }
      
      setSelectedUserId('');
      setSelectedUser(null);
      setAlternateUsers([]);
    } catch (err) {
      setError('Failed to connect user to organizer. Please try again.');
      console.error('Error connecting user to organizer:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect the user from this organizer? This will remove their organizer permissions.')) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await organizersApi.disconnectFromUser(organizer._id, organizer.appId);
      // Call the onSubmit with null to trigger parent refresh
      await onSubmit(null);
      
      // Clear the form
      setSelectedUserId('');
      setSelectedUser(null);
      setAlternateUsers([]);
    } catch (err) {
      setError('Failed to disconnect user from organizer. Please try again.');
      console.error('Error disconnecting user from organizer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h6" gutterBottom>Connect User to Organizer</Typography>
      <Typography variant="body2" gutterBottom color="text.secondary">
        This will link the selected user to the organizer "{organizer.name}" and grant them
        organizer privileges, including the RegionalOrganizer role if they don't already have it.
      </Typography>
      
      <Box sx={{ mt: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Organizer Details
            </Typography>
            <Box sx={{ p: 2, border: '1px solid #eee', borderRadius: 1, mb: 2 }}>
              <Typography variant="body1">
                <strong>Name:</strong> {organizer.name}
              </Typography>
              <Typography variant="body1">
                <strong>Short Name:</strong> {organizer.shortName}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {organizer.isActive ? 'Active' : 'Inactive'} 
                {organizer.isApproved && ', Approved'}
                {organizer.isEnabled && ', Enabled'}
              </Typography>
              {organizer.contactInfo?.email && (
                <Typography variant="body1">
                  <strong>Email:</strong> {organizer.contactInfo.email}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={users}
              loading={userLoading}
              value={selectedUser}
              onChange={handleUserChange}
              filterOptions={filterOptions}
              getOptionLabel={(option) => {
                let displayName = '';
                
                // Build display name from available sources
                if (option.localUserInfo?.loginUserName && option.localUserInfo.loginUserName.trim()) {
                  displayName = option.localUserInfo.loginUserName;
                } else if (option.localUserInfo?.firstName || option.localUserInfo?.lastName) {
                  const firstName = option.localUserInfo?.firstName || '';
                  const lastName = option.localUserInfo?.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  if (fullName) {
                    displayName = fullName;
                  }
                } else if (option.firebaseUserInfo?.displayName && option.firebaseUserInfo.displayName.trim()) {
                  displayName = option.firebaseUserInfo.displayName;
                }
                
                const email = option.firebaseUserInfo?.email || option.email || '';
                
                if (!displayName && email) {
                  return email;
                } else if (displayName && email) {
                  return `${displayName} (${email})`;
                } else if (displayName) {
                  return displayName;
                } else {
                  return 'Unknown User';
                }
              }}
              renderOption={(props, option) => {
                let displayName = '';
                
                // Build display name from available sources
                if (option.localUserInfo?.loginUserName && option.localUserInfo.loginUserName.trim()) {
                  displayName = option.localUserInfo.loginUserName;
                } else if (option.localUserInfo?.firstName || option.localUserInfo?.lastName) {
                  const firstName = option.localUserInfo?.firstName || '';
                  const lastName = option.localUserInfo?.lastName || '';
                  const fullName = `${firstName} ${lastName}`.trim();
                  if (fullName) {
                    displayName = fullName;
                  }
                } else if (option.firebaseUserInfo?.displayName && option.firebaseUserInfo.displayName.trim()) {
                  displayName = option.firebaseUserInfo.displayName;
                }
                
                const email = option.firebaseUserInfo?.email || option.email || '';
                
                return (
                  <li {...props}>
                    <Box>
                      <Typography variant="body1">
                        {displayName || email || 'Unknown User'}
                      </Typography>
                      {email && displayName && (
                        <Typography variant="caption" color="text.secondary">
                          {email}
                        </Typography>
                      )}
                      <Box sx={{ mt: 0.5 }}>
                        {option.roles && option.roles.map((role) => (
                          <Chip 
                            key={role} 
                            label={role} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  </li>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select User"
                  variant="outlined"
                  fullWidth
                  required
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {userLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>
          
          {/* Multi-select for alternate users */}
          {selectedUser && (
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={users.filter(u => u.firebaseUserId !== selectedUser.firebaseUserId)}
                loading={userLoading}
                value={alternateUsers}
                onChange={(event, newValue) => setAlternateUsers(newValue)}
                filterOptions={filterOptions}
                getOptionLabel={(option) => {
                  let displayName = '';
                  
                  // Build display name from available sources
                  if (option.localUserInfo?.loginUserName && option.localUserInfo.loginUserName.trim()) {
                    displayName = option.localUserInfo.loginUserName;
                  } else if (option.localUserInfo?.firstName || option.localUserInfo?.lastName) {
                    const firstName = option.localUserInfo?.firstName || '';
                    const lastName = option.localUserInfo?.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    if (fullName) {
                      displayName = fullName;
                    }
                  } else if (option.firebaseUserInfo?.displayName && option.firebaseUserInfo.displayName.trim()) {
                    displayName = option.firebaseUserInfo.displayName;
                  }
                  
                  const email = option.firebaseUserInfo?.email || option.email || '';
                  
                  if (!displayName && email) {
                    return email;
                  } else if (displayName && email) {
                    return `${displayName} (${email})`;
                  } else if (displayName) {
                    return displayName;
                  } else {
                    return 'Unknown User';
                  }
                }}
                renderOption={(props, option) => {
                  let displayName = '';
                  
                  // Build display name from available sources
                  if (option.localUserInfo?.loginUserName && option.localUserInfo.loginUserName.trim()) {
                    displayName = option.localUserInfo.loginUserName;
                  } else if (option.localUserInfo?.firstName || option.localUserInfo?.lastName) {
                    const firstName = option.localUserInfo?.firstName || '';
                    const lastName = option.localUserInfo?.lastName || '';
                    const fullName = `${firstName} ${lastName}`.trim();
                    if (fullName) {
                      displayName = fullName;
                    }
                  } else if (option.firebaseUserInfo?.displayName && option.firebaseUserInfo.displayName.trim()) {
                    displayName = option.firebaseUserInfo.displayName;
                  }
                  
                  const email = option.firebaseUserInfo?.email || option.email || '';
                  
                  return (
                    <li {...props}>
                      <Box>
                        <Typography variant="body1">
                          {displayName || email || 'Unknown User'}
                        </Typography>
                        {email && displayName && (
                          <Typography variant="caption" color="text.secondary">
                            {email}
                          </Typography>
                        )}
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Alternate Users (Optional)"
                    variant="outlined"
                    fullWidth
                    helperText="Select additional users who can manage this organizer"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {userLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
          )}
        </Grid>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
        {/* Show disconnect button if organizer already has a linked user */}
        {organizer.linkedUserLogin && (
          <Button 
            variant="outlined" 
            color="error" 
            disabled={loading}
            startIcon={<LinkOffIcon />}
            onClick={handleDisconnect}
          >
            {loading ? 'Disconnecting...' : 'Disconnect User'}
          </Button>
        )}
        
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={loading || !selectedUserId}
            startIcon={<LinkIcon />}
          >
            {loading ? 'Connecting...' : 'Connect User'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}