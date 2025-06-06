'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  Chip,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { formatDistanceToNow } from 'date-fns';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LinkIcon from '@mui/icons-material/Link';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UpdateIcon from '@mui/icons-material/Update';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

/**
 * Get provider icon based on provider ID
 */
const getProviderIcon = (providerId) => {
  switch (providerId) {
    case 'google.com':
      return <GoogleIcon sx={{ fontSize: 16, color: '#DB4437' }} />;
    case 'facebook.com':
      return <FacebookIcon sx={{ fontSize: 16, color: '#1877F2' }} />;
    case 'phone':
      return <PhoneIcon sx={{ fontSize: 16, color: '#4285F4' }} />;
    case 'password':
    default:
      return <EmailIcon sx={{ fontSize: 16, color: '#34A853' }} />;
  }
};

/**
 * Get user photo URL from provider data
 */
const getUserPhotoURL = (user) => {
  // Check if providerData has a photo
  if (user.providerData && user.providerData.length > 0) {
    const photoURL = user.providerData[0].photoURL;
    if (photoURL) return photoURL;
  }
  return null;
};

/**
 * Get best available email from user data
 */
const getBestEmail = (user) => {
  // Try top-level email first
  if (user.email) return user.email;
  
  // Fallback to provider email
  if (user.providerData && user.providerData.length > 0) {
    const providerEmail = user.providerData[0].email;
    if (providerEmail) return providerEmail;
  }
  
  return null;
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Never';
  try {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * FirebaseUsersTable component
 * Displays Firebase users with matching status to userlogins
 */
const FirebaseUsersTable = ({
  firebaseUsers = [],
  stats = {},
  loading = false,
  error = null,
  onRefresh,
  onViewDetails,
  onCreateUserLogin,
  onUpdateUserLogin,
  filter = 'all' // 'all', 'matched', 'unmatched'
}) => {
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Filter users based on current filter
  useEffect(() => {
    let filtered = firebaseUsers;
    
    if (filter === 'matched') {
      filtered = firebaseUsers.filter(user => user.matchStatus === 'matched');
    } else if (filter === 'unmatched') {
      filtered = firebaseUsers.filter(user => user.matchStatus === 'unmatched');
    }
    
    setFilteredUsers(filtered);
  }, [firebaseUsers, filter]);

  // Define columns for DataGrid
  const columns = [
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {user.email || 'No email'}
            </Typography>
            {user.emailVerified && (
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
            )}
          </Box>
        );
      }
    },
    {
      field: 'displayName',
      headerName: 'Display Name',
      width: 180,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        return (
          <Typography variant="body2">
            {user.displayName || 'No name'}
          </Typography>
        );
      }
    },
    {
      field: 'primaryProvider',
      headerName: 'Auth Method',
      width: 120,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        return (
          <Tooltip title={`Authenticated via ${user.primaryProvider}`} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getProviderIcon(user.primaryProvider)}
              <Typography variant="caption">
                {user.primaryProvider === 'google.com' ? 'Google' : 
                 user.primaryProvider === 'phone' ? 'Phone' : 'Email'}
              </Typography>
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'lastSignInTime',
      headerName: 'Last Sign In',
      width: 150,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        const formattedTime = formatTimestamp(user.lastSignInTime);
        
        return (
          <Tooltip title={user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString() : 'Never signed in'} arrow>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              {formattedTime}
            </Typography>
          </Tooltip>
        );
      }
    },
    {
      field: 'matchStatus',
      headerName: 'Status',
      width: 120,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        const isMatched = user.matchStatus === 'matched';
        
        return (
          <Chip
            icon={isMatched ? <CheckCircleIcon /> : <WarningIcon />}
            label={isMatched ? 'Matched' : 'Unmatched'}
            color={isMatched ? 'success' : 'warning'}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      field: 'disabled',
      headerName: 'Active',
      width: 80,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        return (
          <Typography 
            color={user.disabled ? 'error.main' : 'success.main'}
            sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}
          >
            {user.disabled ? '❌' : '✓'}
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => {
        const user = params.row;
        const isUnmatched = user.matchStatus === 'unmatched';
        
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => onViewDetails && onViewDetails(user)}
            >
              Details
            </Button>
            {isUnmatched && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<LinkIcon />}
                onClick={() => onCreateUserLogin && onCreateUserLogin(user)}
              >
                Link
              </Button>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Stats Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Firebase Users Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Users
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.matched || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Matched
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.unmatched || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Unmatched
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={onRefresh}
                  disabled={loading}
                  size="small"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {typeof error === 'string' ? error : error.message}
        </Alert>
      )}

      {/* Loading or Data Grid */}
      <Box sx={{ height: 600, width: '100%' }}>
        {loading && filteredUsers.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            getRowId={(row) => row.uid}
            pagination
            paginationMode="client"
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            disableSelectionOnClick
            density="standard"
            loading={loading}
            components={{
              NoRowsOverlay: () => (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  {filter === 'all' ? 'No Firebase users found' :
                   filter === 'matched' ? 'No matched users found' :
                   'No unmatched users found'}
                </Box>
              )
            }}
          />
        )}
      </Box>
    </Box>
  );
};

FirebaseUsersTable.propTypes = {
  /**
   * Array of Firebase user objects
   */
  firebaseUsers: PropTypes.array,
  
  /**
   * Statistics object
   */
  stats: PropTypes.shape({
    total: PropTypes.number,
    matched: PropTypes.number,
    unmatched: PropTypes.number
  }),
  
  /**
   * Loading state
   */
  loading: PropTypes.bool,
  
  /**
   * Error message or object
   */
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  
  /**
   * Refresh callback
   */
  onRefresh: PropTypes.func,
  
  /**
   * View details callback
   */
  onViewDetails: PropTypes.func,
  
  /**
   * Create UserLogin callback
   */
  onCreateUserLogin: PropTypes.func,
  
  /**
   * Filter type: 'all', 'matched', 'unmatched'
   */
  filter: PropTypes.oneOf(['all', 'matched', 'unmatched'])
};

export default FirebaseUsersTable;