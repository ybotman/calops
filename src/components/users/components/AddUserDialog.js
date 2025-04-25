'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress,
  Box,
  Alert
} from '@mui/material';

/**
 * AddUserDialog component
 * Dialog for creating new users
 */
const AddUserDialog = ({ open, onClose, onSubmit, loading = false }) => {
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    active: true,
    isOrganizer: false,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle checkbox/switch change
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!userData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!userData.password) {
      errors.password = 'Password is required';
    } else if (userData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!userData.firstName) {
      errors.firstName = 'First name is required';
    }
    
    if (!userData.lastName) {
      errors.lastName = 'Last name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await onSubmit(userData);
      handleReset();
    } catch (error) {
      setSubmitError(error.message || 'Failed to create user');
    }
  };

  // Reset form
  const handleReset = () => {
    setUserData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      active: true,
      isOrganizer: false,
    });
    setFormErrors({});
    setSubmitError('');
  };

  // Handle dialog close
  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit
      }}
    >
      <DialogTitle>Add New User</DialogTitle>
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="First Name"
                name="firstName"
                value={userData.firstName}
                onChange={handleChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Last Name"
                name="lastName"
                value={userData.lastName}
                onChange={handleChange}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Email"
                name="email"
                type="email"
                value={userData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Password"
                name="password"
                type="password"
                value={userData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password || "Minimum 6 characters"}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userData.active}
                    onChange={handleSwitchChange}
                    name="active"
                  />
                }
                label="User is Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={userData.isOrganizer}
                    onChange={handleSwitchChange}
                    name="isOrganizer"
                  />
                }
                label="Create Organizer for this User"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddUserDialog.propTypes = {
  /**
   * Dialog visibility
   */
  open: PropTypes.bool.isRequired,
  
  /**
   * Close dialog callback
   */
  onClose: PropTypes.func.isRequired,
  
  /**
   * Submit form callback
   */
  onSubmit: PropTypes.func.isRequired,
  
  /**
   * Loading state during submission
   */
  loading: PropTypes.bool
};

export default AddUserDialog;