'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress
} from '@mui/material';
import { useApplicationForm } from './hooks';

/**
 * Application form component for creating and editing applications
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Handler for closing the dialog
 * @param {Object} props.application - Application data for editing (null for create)
 * @param {Function} props.onSave - Handler for save action
 */
const ApplicationForm = ({ open, onClose, application, onSave }) => {
  const {
    formData,
    setFormData,
    loading,
    saving,
    error,
    isEdit,
    handleChange,
    handleSubmit,
    resetForm
  } = useApplicationForm(application?.appId);

  // Update form when application prop changes
  useEffect(() => {
    if (application) {
      setFormData({
        appId: application.appId || '',
        name: application.name || '',
        description: application.description || '',
        url: application.url || '',
        logoUrl: application.logoUrl || '',
        isActive: application.isActive !== undefined ? application.isActive : true,
        settings: {
          defaultRegionId: application.settings?.defaultRegionId || null,
          defaultDivisionId: application.settings?.defaultDivisionId || null,
          defaultCityId: application.settings?.defaultCityId || null,
          features: application.settings?.features || [],
          categorySettings: application.settings?.categorySettings || {}
        }
      });
    } else {
      resetForm();
    }
  }, [application, setFormData, resetForm]);

  // Handle form submission
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    
    const result = await handleSubmit();
    
    if (result.success) {
      if (onSave) {
        onSave(result);
      }
      onClose();
    }
  };

  // Handle dialog close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <form onSubmit={handleFormSubmit}>
        <DialogTitle>
          {isEdit ? 'Edit Application' : 'Create New Application'}
        </DialogTitle>
        
        <DialogContent dividers>
          {loading ? (
            <Grid container justifyContent="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {/* App ID */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Application ID"
                  name="appId"
                  value={formData.appId}
                  onChange={handleChange}
                  margin="normal"
                  disabled={isEdit} // Can't change appId once created
                  helperText={isEdit ? "App ID cannot be changed after creation" : "Unique identifier for this application"}
                />
              </Grid>
              
              {/* Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Application Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                />
              </Grid>
              
              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={3}
                />
              </Grid>
              
              {/* URL */}
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Application URL"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  margin="normal"
                  placeholder="https://example.com"
                />
              </Grid>
              
              {/* Logo URL */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Logo URL"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  margin="normal"
                  placeholder="https://example.com/logo.png"
                  helperText="Optional URL to application logo image"
                />
              </Grid>
              
              {/* Active Status */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="Application Active"
                />
              </Grid>
              
              {/* Settings section - can be expanded in the future */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Features (comma-separated)"
                  name="settings.features"
                  value={formData.settings?.features?.join(', ') || ''}
                  onChange={(e) => {
                    const featuresString = e.target.value;
                    const featuresArray = featuresString
                      .split(',')
                      .map(feature => feature.trim())
                      .filter(Boolean);
                      
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        features: featuresArray
                      }
                    });
                  }}
                  margin="normal"
                  helperText="Optional list of enabled features (e.g. 'geolocation, events, users')"
                />
              </Grid>
              
              {/* Error message display */}
              {error && (
                <Grid item xs={12}>
                  <div style={{ color: 'red', marginTop: 10 }}>
                    Error: {error}
                  </div>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            disabled={loading || saving}
          >
            {saving ? <CircularProgress size={24} /> : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ApplicationForm;