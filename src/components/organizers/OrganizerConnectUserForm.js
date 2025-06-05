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
import { usersApi } from '@/lib/api-client';

export default function OrganizerConnectUserForm({ organizer, onSubmit }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
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
        setUserLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
        setUserLoading(false);
      }
    };

    fetchUsers();
  }, [organizer.appId]);

  // Handle user selection
  const handleUserChange = (event, newValue) => {
    setSelectedUser(newValue);
    setSelectedUserId(newValue?.firebaseUserId || '');
  };

  // Filter users for Autocomplete
  const filterOptions = (options, { inputValue }) => {
    const filterValue = inputValue.toLowerCase().trim();
    return options.filter((option) => {
      const name = `${option.localUserInfo?.firstName || ''} ${option.localUserInfo?.lastName || ''}`.toLowerCase();
      const email = (option.firebaseUserInfo?.email || '').toLowerCase();
      const userId = (option.firebaseUserId || '').toLowerCase();
      
      return (
        name.includes(filterValue) ||
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
      await onSubmit(selectedUserId);
      setSelectedUserId('');
      setSelectedUser(null);
    } catch (err) {
      setError('Failed to connect user to organizer. Please try again.');
      console.error('Error connecting user to organizer:', err);
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
                const displayName = option.firebaseUserInfo?.displayName || 
                                  `${option.localUserInfo?.firstName || ''} ${option.localUserInfo?.lastName || ''}`.trim() ||
                                  'Unnamed User';
                const email = option.firebaseUserInfo?.email || 'No email';
                return `${displayName} (${email})`;
              }}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">
                      {option.firebaseUserInfo?.displayName || 
                       `${option.localUserInfo?.firstName || ''} ${option.localUserInfo?.lastName || ''}`.trim() ||
                       'Unnamed User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.firebaseUserInfo?.email || 'No email'}
                    </Typography>
                  </Box>
                </li>
              )}
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
        </Grid>
      </Box>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
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
  );
}