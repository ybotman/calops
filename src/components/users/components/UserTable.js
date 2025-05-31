'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { formatDistanceToNow } from 'date-fns';
import StatusDisplay from './StatusDisplay';
import ActionButtons from './ActionButtons';

/**
 * Utility function to truncate Firebase ID for display
 * @param {string} firebaseUserId - Full Firebase user ID
 * @returns {string} Truncated ID with ellipsis
 */
const formatFirebaseId = (firebaseUserId) => {
  if (!firebaseUserId) return 'N/A';
  return firebaseUserId.length > 8 ? `${firebaseUserId.substring(0, 8)}...` : firebaseUserId;
};

/**
 * Utility function to format updatedAt timestamp
 * @param {string|Date} updatedAt - Updated timestamp
 * @returns {string} Relative time string
 */
const formatUpdatedAt = (updatedAt) => {
  if (!updatedAt) return 'Never';
  try {
    const date = new Date(updatedAt);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * UserTable component
 * Displays user data with filtering, sorting, and actions
 */
const UserTable = ({
  users,
  loading = false,
  onEdit,
  onDelete,
  onCreateOrganizer,
  onDeleteOrganizer,
  pagination = {
    page: 0,
    pageSize: 10,
    totalCount: 0
  },
  onPaginationChange,
  error,
  selectedUser
}) => {
  // Define columns for DataGrid
  const columns = [
    { 
      field: 'firebaseUserId', 
      headerName: 'Firebase ID', 
      width: 120,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        const fullFirebaseId = user.firebaseUserId;
        const truncatedId = formatFirebaseId(fullFirebaseId);
        
        return (
          <Tooltip title={fullFirebaseId || 'No Firebase ID'} arrow>
            <Typography 
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.85rem',
                cursor: 'help',
                color: fullFirebaseId ? 'text.primary' : 'text.disabled'
              }}
            >
              {truncatedId}
            </Typography>
          </Tooltip>
        );
      }
    },
    { 
      field: 'updatedAt', 
      headerName: 'Updated At', 
      width: 140,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        const formattedTime = formatUpdatedAt(user.updatedAt);
        
        return (
          <Tooltip title={user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Never updated'} arrow>
            <Typography 
              sx={{ 
                fontSize: '0.85rem',
                cursor: 'help',
                color: user.updatedAt ? 'text.primary' : 'text.disabled'
              }}
            >
              {formattedTime}
            </Typography>
          </Tooltip>
        );
      }
    },
    { field: 'displayName', headerName: 'Name', width: 180, sortable: true },
    { field: 'email', headerName: 'Email', width: 220, sortable: true },
    { field: 'roleNames', headerName: 'Roles', width: 120, sortable: true },
    { 
      field: 'hasOrganizerId', 
      headerName: 'Org ID', 
      width: 80,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        const hasOrganizerId = user.regionalOrganizerInfo?.organizerId;
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {hasOrganizerId ? (
              <Typography 
                color="success.main" 
                sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}
              >
                ✓
              </Typography>
            ) : (
              <Typography 
                color="text.disabled" 
                sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
              >
                -
              </Typography>
            )}
          </Box>
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 200,
      sortable: true,
      renderCell: (params) => <StatusDisplay user={params.row} />
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 150,
      sortable: false, // Actions column should not be sortable
      renderCell: (params) => {
        const user = params.row;
        const isSelected = selectedUser?._id === user._id;
        
        return (
          <ActionButtons 
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            loading={loading}
            isSelected={isSelected}
          />
        );
      }
    },
  ];

  // Handle organizer actions if they are provided
  if (onCreateOrganizer && onDeleteOrganizer) {
    // Add organizer actions column
    columns.splice(7, 0, {
      field: 'organizerActions',
      headerName: 'Organizer',
      width: 150,
      sortable: false, // Action columns should not be sortable
      renderCell: (params) => {
        const user = params.row;
        const isSelected = selectedUser?._id === user._id;
        
        return (
          <ActionButtons 
            user={user}
            onCreateOrganizer={onCreateOrganizer}
            onDeleteOrganizer={onDeleteOrganizer}
            loading={loading}
            isSelected={isSelected}
            showConfirmation={false}
          />
        );
      }
    });
  }

  // Handle pagination changes
  const handlePaginationChange = (params) => {
    if (onPaginationChange) {
      onPaginationChange(params.page, params.pageSize);
    }
  };

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          Error: {error}
        </Typography>
      )}
      
      {loading && !selectedUser ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={users}
          columns={columns}
          pagination
          paginationMode="client"
          page={pagination?.page || 0}
          pageSize={pagination?.pageSize || 10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(page) => handlePaginationChange({ page })}
          onPageSizeChange={(pageSize) => handlePaginationChange({ page: 0, pageSize })}
          disableSelectionOnClick
          density="standard"
          components={{
            NoRowsOverlay: () => (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                {loading ? 'Loading...' : 'No users found matching the criteria'}
              </Box>
            )
          }}
        />
      )}
    </Box>
  );
};

UserTable.propTypes = {
  /**
   * Array of user objects to display
   */
  users: PropTypes.array.isRequired,
  
  /**
   * Loading state
   */
  loading: PropTypes.bool,
  
  /**
   * Callback when edit button is clicked
   */
  onEdit: PropTypes.func.isRequired,
  
  /**
   * Callback when delete button is clicked
   */
  onDelete: PropTypes.func.isRequired,
  
  /**
   * Optional callback for organizer creation
   */
  onCreateOrganizer: PropTypes.func,
  
  /**
   * Optional callback for organizer deletion
   */
  onDeleteOrganizer: PropTypes.func,
  
  /**
   * Pagination state
   */
  pagination: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    totalCount: PropTypes.number
  }),
  
  /**
   * Callback for pagination changes
   */
  onPaginationChange: PropTypes.func,
  
  /**
   * Error message to display
   */
  error: PropTypes.string,
  
  /**
   * Currently selected user (for showing loading states)
   */
  selectedUser: PropTypes.object
};


export default UserTable;