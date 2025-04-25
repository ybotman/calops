'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StatusDisplay from './StatusDisplay';

/**
 * UserTable component
 * Displays user data with filtering, sorting, and actions
 */
const UserTable = ({
  users,
  loading,
  onEdit,
  onDelete,
  onCreateOrganizer,
  onDeleteOrganizer,
  pagination,
  onPaginationChange,
  error,
  selectedUser
}) => {
  // Define columns for DataGrid
  const columns = [
    { field: 'displayName', headerName: 'Name', width: 180 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'roleNames', headerName: 'Roles', width: 120 },
    { 
      field: 'hasOrganizerId', 
      headerName: 'Org ID', 
      width: 80,
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
      renderCell: (params) => <StatusDisplay user={params.row} />
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 150,
      renderCell: (params) => {
        const user = params.row;
        const isDeleting = loading && selectedUser?._id === user._id;
        
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="text"
              color="primary"
              onClick={() => onEdit(user)}
              startIcon={<EditIcon />}
              size="small"
            >
              Edit
            </Button>
            
            <Tooltip title="Delete user permanently">
              <Button
                variant="text"
                color="error"
                onClick={() => onDelete(user)}
                startIcon={<DeleteIcon />}
                disabled={isDeleting}
                size="small"
                sx={{ marginLeft: 'auto' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Tooltip>
          </Box>
        );
      }
    },
  ];

  // Handle organizer actions if they are provided
  if (onCreateOrganizer && onDeleteOrganizer) {
    // Add organizer actions column
    columns.splice(5, 0, {
      field: 'organizerActions',
      headerName: 'Organizer',
      width: 150,
      renderCell: (params) => {
        const user = params.row;
        const hasOrgId = user.regionalOrganizerInfo?.organizerId;
        const isProcessing = loading && selectedUser?._id === user._id;
        
        if (hasOrgId) {
          return (
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={() => onDeleteOrganizer(user)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Remove Org'}
            </Button>
          );
        }
        
        return (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => onCreateOrganizer(user)}
            disabled={isProcessing}
          >
            {isProcessing ? 'Creating...' : 'Make Organizer'}
          </Button>
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
          rowCount={pagination?.totalCount || users.length}
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

UserTable.defaultProps = {
  loading: false,
  pagination: {
    page: 0,
    pageSize: 10,
    totalCount: 0
  }
};

export default UserTable;