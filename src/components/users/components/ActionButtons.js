'use client';

import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Tooltip, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * ActionButtons component
 * Renders action buttons for user management in DataGrid cells
 */
const ActionButtons = ({
  user,
  onEdit,
  onDelete,
  onCreateOrganizer,
  onDeleteOrganizer,
  loading = false,
  isSelected = false,
  showConfirmation = true
}) => {
  // Handler for delete with optional confirmation
  const handleDelete = () => {
    if (!showConfirmation || window.confirm(`Are you sure you want to delete ${user.displayName}?`)) {
      onDelete(user._id || user.id);
    }
  };
  
  // Render organizer button if handlers are provided
  const renderOrganizerButton = () => {
    if (!onCreateOrganizer || !onDeleteOrganizer) return null;
    
    const hasOrgId = user.regionalOrganizerInfo?.organizerId;
    
    if (hasOrgId) {
      return (
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={() => onDeleteOrganizer(user)}
          disabled={loading && isSelected}
          data-testid="remove-organizer-button"
        >
          {loading && isSelected ? 'Processing...' : 'Remove Org'}
        </Button>
      );
    }
    
    return (
      <Button
        variant="outlined"
        color="primary"
        size="small"
        onClick={() => onCreateOrganizer(user)}
        disabled={loading && isSelected}
        data-testid="create-organizer-button"
      >
        {loading && isSelected ? 'Creating...' : 'Make Organizer'}
      </Button>
    );
  };
  
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        variant="text"
        color="primary"
        onClick={() => onEdit(user)}
        startIcon={<EditIcon />}
        size="small"
        data-testid="edit-user-button"
      >
        Edit
      </Button>
      
      <Tooltip title="Delete user permanently">
        <Button
          variant="text"
          color="error"
          onClick={handleDelete}
          startIcon={loading && isSelected ? <CircularProgress size={16} /> : <DeleteIcon />}
          disabled={loading && isSelected}
          size="small"
          data-testid="delete-user-button"
        >
          {loading && isSelected ? 'Deleting...' : 'Delete'}
        </Button>
      </Tooltip>
      
      {renderOrganizerButton()}
    </Box>
  );
};

ActionButtons.propTypes = {
  /**
   * User data
   */
  user: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    regionalOrganizerInfo: PropTypes.shape({
      organizerId: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    })
  }).isRequired,
  
  /**
   * Edit button click handler
   */
  onEdit: PropTypes.func.isRequired,
  
  /**
   * Delete button click handler
   */
  onDelete: PropTypes.func.isRequired,
  
  /**
   * Create organizer button click handler
   */
  onCreateOrganizer: PropTypes.func,
  
  /**
   * Delete organizer button click handler
   */
  onDeleteOrganizer: PropTypes.func,
  
  /**
   * Loading state
   */
  loading: PropTypes.bool,
  
  /**
   * Whether this row is the one being processed
   */
  isSelected: PropTypes.bool,
  
  /**
   * Whether to show delete confirmation
   */
  showConfirmation: PropTypes.bool
};

export default ActionButtons;