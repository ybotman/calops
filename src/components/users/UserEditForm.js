import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Grid,
  FormControlLabel,
  Switch,
  Button,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

/**
 * Simplified User Edit Form Component
 * Provides a streamlined interface for editing user permissions across roles
 */
const SimplifiedUserEditForm = ({ user, onChange, onSave, loading }) => {
  if (!user) return null;

  // Helper function to safely get nested values
  const getNestedValue = (obj, path, defaultValue = '') => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    
    return result === undefined || result === null ? defaultValue : result;
  };

  // Extract user information
  const firebaseUserId = user.firebaseUserId || '';
  const email = getNestedValue(user, 'firebaseUserInfo.email');
  const displayName = getNestedValue(user, 'firebaseUserInfo.displayName') || 
    `${getNestedValue(user, 'localUserInfo.firstName')} ${getNestedValue(user, 'localUserInfo.lastName')}`.trim();

  // Handle toggle change
  const handleToggleChange = (fieldPath) => (event) => {
    // Make sure onChange exists before calling it
    if (typeof onChange === 'function') {
      onChange(fieldPath, event.target.checked);
    } else {
      console.error('onChange prop is not a function or is not provided');
    }
  };

  // Configuration for status sections and fields
  const statusSections = [
    {
      title: 'User Status',
      fields: [
        { path: 'localUserInfo.isApproved', label: 'Approved' },
        { path: 'localUserInfo.isEnabled', label: 'Enabled' },
      ],
      activeField: 'localUserInfo.isActive'
    },
    {
      title: 'Organizer Status',
      fields: [
        { path: 'regionalOrganizerInfo.isApproved', label: 'Approved' },
        { path: 'regionalOrganizerInfo.isEnabled', label: 'Enabled' },
      ],
      activeField: 'regionalOrganizerInfo.isActive'
    },
    {
      title: 'Admin Status',
      fields: [
        { path: 'localAdminInfo.isApproved', label: 'Approved' },
        { path: 'localAdminInfo.isEnabled', label: 'Enabled' },
      ],
      activeField: 'localAdminInfo.isActive'
    }
  ];

  return (
    <Box component="form" sx={{ mt: 2 }}>
      {/* User identity information (read-only) */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>User Information</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2">
            <strong>Name:</strong> {displayName}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {email}
          </Typography>
          <Typography variant="body2">
            <strong>Firebase ID:</strong> {firebaseUserId}
          </Typography>
        </Box>
      </Paper>

      {/* Permission toggle grid */}
      <Grid container spacing={3}>
        {statusSections.map((section, index) => (
          <Grid item xs={12} key={index}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>{section.title}</Typography>
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                {/* Editable toggles */}
                {section.fields.map((field) => (
                  <FormControlLabel
                    key={field.path}
                    control={
                      <Switch
                        checked={getNestedValue(user, field.path, false)}
                        onChange={handleToggleChange(field.path)}
                        color="primary"
                      />
                    }
                    label={field.label}
                  />
                ))}
                
                {/* Read-only Active status */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
                  <Chip 
                    label={getNestedValue(user, section.activeField, false) ? "Active" : "Inactive"} 
                    color={getNestedValue(user, section.activeField, false) ? "success" : "default"}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (auto-configured)
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Save button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="button"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={<SaveIcon />}
          onClick={onSave}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

SimplifiedUserEditForm.propTypes = {
  /**
   * User object containing all user data
   */
  user: PropTypes.shape({
    firebaseUserId: PropTypes.string,
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
  }).isRequired,
  
  /**
   * Callback function when a field is changed
   */
  onChange: PropTypes.func.isRequired,
  
  /**
   * Callback function when form is submitted
   */
  onSave: PropTypes.func.isRequired,
  
  /**
   * Loading state to disable form submission
   */
  loading: PropTypes.bool
};

SimplifiedUserEditForm.defaultProps = {
  loading: false
};

export default SimplifiedUserEditForm;