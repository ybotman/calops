'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import MobileDialog from '@/components/common/MobileDialog';
import UserEditForm from '@/components/users/UserEditForm';

/**
 * EditUserDialog component
 * Dialog for editing existing users
 */
const EditUserDialog = ({ 
  open, 
  onClose, 
  user, 
  roles, 
  onSubmit, 
  loading 
}) => {
  const [editingUser, setEditingUser] = useState(user);

  // Update local state when user prop changes
  useEffect(() => {
    setEditingUser(user);
  }, [user]);

  // Handle dialog close
  const handleClose = () => {
    onClose();
  };

  // Handle field changes
  const handleChange = (fieldPath, value) => {
    setEditingUser(prevUser => {
      const newUser = { ...prevUser };
      
      // Handle nested field paths like 'localUserInfo.firstName'
      const keys = fieldPath.split('.');
      let current = newUser;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Set the final value
      const finalKey = keys[keys.length - 1];
      current[finalKey] = value;
      
      return newUser;
    });
  };

  // Handle form submission
  const handleSubmit = (updatedUser) => {
    if (onSubmit) {
      onSubmit(updatedUser);
    }
  };

  return (
    <MobileDialog 
      open={open} 
      onClose={handleClose} 
      title="Edit User"
      maxWidth="md"
    >
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        {editingUser && roles.length > 0 && (
          <UserEditForm
            user={editingUser}
            roles={roles}
            onChange={handleChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
    </MobileDialog>
  );
};

EditUserDialog.propTypes = {
  /**
   * Dialog visibility
   */
  open: PropTypes.bool.isRequired,
  
  /**
   * Close dialog callback
   */
  onClose: PropTypes.func.isRequired,
  
  /**
   * User being edited
   */
  user: PropTypes.shape({
    _id: PropTypes.string,
    firebaseUserId: PropTypes.string,
    appId: PropTypes.string,
    active: PropTypes.bool,
    roleIds: PropTypes.array,
    firebaseUserInfo: PropTypes.shape({
      email: PropTypes.string,
      displayName: PropTypes.string
    }),
    localUserInfo: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      isApproved: PropTypes.bool,
      isEnabled: PropTypes.bool,
      isActive: PropTypes.bool
    }),
    regionalOrganizerInfo: PropTypes.shape({
      isApproved: PropTypes.bool,
      isEnabled: PropTypes.bool,
      isActive: PropTypes.bool,
      organizerId: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
    }),
    localAdminInfo: PropTypes.shape({
      isApproved: PropTypes.bool,
      isEnabled: PropTypes.bool,
      isActive: PropTypes.bool
    })
  }),
  
  /**
   * Available roles
   */
  roles: PropTypes.array.isRequired,
  
  /**
   * Submit callback
   */
  onSubmit: PropTypes.func.isRequired,
  
  /**
   * Loading state during submission
   */
  loading: PropTypes.bool
};

export default EditUserDialog;