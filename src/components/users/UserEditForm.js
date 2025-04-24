'use client';

import React, { useState, useEffect } from 'react';
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
  Chip,
  Tabs,
  Tab,
  TextField,
  List,
  ListItem,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-edit-tabpanel-${index}`}
      aria-labelledby={`user-edit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/**
 * Enhanced User Edit Form Component
 * Provides a tabbed interface for editing user details, roles, and status
 */
const UserEditForm = ({ user, roles, onChange, onSubmit, loading }) => {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');

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
  const firstName = getNestedValue(user, 'localUserInfo.firstName', '');
  const lastName = getNestedValue(user, 'localUserInfo.lastName', '');
  const displayName = getNestedValue(user, 'firebaseUserInfo.displayName') || 
    `${firstName} ${lastName}`.trim();

  // Handle toggle change
  const handleToggleChange = (fieldPath) => (event) => {
    // Make sure onChange exists before calling it
    if (typeof onChange === 'function') {
      onChange(fieldPath, event.target.checked);
    } else {
      console.error('onChange prop is not a function or is not provided');
      setError('Unable to save changes. Please try again later.');
    }
  };

  // Handle text field change
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    
    if (typeof onChange === 'function') {
      onChange(name, value);
    } else {
      console.error('onChange prop is not a function or is not provided');
      setError('Unable to save changes. Please try again later.');
    }
  };

  // Handle role selection changes
  const handleRoleChange = (e, roleId) => {
    const { checked } = e.target;
    
    // Get current roleIds
    const currentRoleIds = [...(user.roleIds || [])].map(role => 
      typeof role === 'object' ? role._id : role
    );
    
    // Update roleIds based on selection
    let newRoleIds;
    if (checked) {
      // Add role if it doesn't exist
      newRoleIds = [...currentRoleIds, roleId];
    } else {
      // Remove role if it exists
      newRoleIds = currentRoleIds.filter(id => id !== roleId);
    }
    
    // Update the entire roleIds array
    if (typeof onChange === 'function') {
      onChange('roleIds', newRoleIds);
    } else {
      console.error('onChange prop is not a function or is not provided');
      setError('Unable to save changes. Please try again later.');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit(user);
    } else {
      console.error('onSubmit prop is not a function or is not provided');
      setError('Unable to save changes. Please try again later.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
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

      {/* Tabs for different sections */}
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="user edit tabs">
        <Tab label="Basic Info" id="user-edit-tab-0" />
        <Tab label="Roles" id="user-edit-tab-1" />
        <Tab label="User Status" id="user-edit-tab-2" />
        <Tab label="Organizer Status" id="user-edit-tab-3" />
        <Tab label="Admin Status" id="user-edit-tab-4" />
        <Tab label="Advanced" id="user-edit-tab-5" />
      </Tabs>

      {/* Basic Info Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              name="localUserInfo.firstName"
              value={firstName}
              onChange={handleTextChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="localUserInfo.lastName"
              value={lastName}
              onChange={handleTextChange}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Firebase User ID"
              value={firebaseUserId}
              disabled
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch 
                  checked={user.active !== false}
                  onChange={handleToggleChange('active')}
                  color="primary"
                />
              }
              label="User is Active"
            />
          </Grid>
        </Grid>
      </TabPanel>

      {/* Roles Tab */}
      <TabPanel value={tabValue} index={1}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Role Assignments</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {roles.map((role) => {
                // Get current roleIds in a consistent format
                const roleIds = (user.roleIds || []).map(r => 
                  typeof r === 'object' && r._id ? r._id : r
                );
                
                // Check if this role is included
                const isChecked = roleIds.some(id => 
                  String(id).trim() === String(role._id).trim()
                );
                
                return (
                  <ListItem key={role._id} dense>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => handleRoleChange(e, role._id)}
                          name={`role-${role._id}`}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1">{role.roleName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {role.description || role.roleNameCode}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      </TabPanel>

      {/* User Status Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>User Status</Typography>
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={getNestedValue(user, 'localUserInfo.isApproved', false)}
                  onChange={handleToggleChange('localUserInfo.isApproved')}
                  color="primary"
                />
              }
              label="Approved"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={getNestedValue(user, 'localUserInfo.isEnabled', false)}
                  onChange={handleToggleChange('localUserInfo.isEnabled')}
                  color="primary"
                />
              }
              label="Enabled"
            />
            
            {/* Read-only Active status */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
              <Chip 
                label={getNestedValue(user, 'localUserInfo.isActive', false) ? "Active" : "Inactive"} 
                color={getNestedValue(user, 'localUserInfo.isActive', false) ? "success" : "default"}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (auto-configured based on approval and enabled status)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </TabPanel>

      {/* Organizer Status Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Organizer Status</Typography>
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={getNestedValue(user, 'regionalOrganizerInfo.isApproved', false)}
                  onChange={handleToggleChange('regionalOrganizerInfo.isApproved')}
                  color="primary"
                />
              }
              label="Approved as Organizer"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={getNestedValue(user, 'regionalOrganizerInfo.isEnabled', false)}
                  onChange={handleToggleChange('regionalOrganizerInfo.isEnabled')}
                  color="primary"
                />
              }
              label="Enabled as Organizer"
            />
            
            {/* Read-only Active status */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
              <Chip 
                label={getNestedValue(user, 'regionalOrganizerInfo.isActive', false) ? "Active" : "Inactive"} 
                color={getNestedValue(user, 'regionalOrganizerInfo.isActive', false) ? "success" : "default"}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (auto-configured based on approval and enabled status)
              </Typography>
            </Box>
            
            {/* Organizer ID display */}
            {getNestedValue(user, 'regionalOrganizerInfo.organizerId') && (
              <Box sx={{ mt: 2, p: 1.5, border: '1px solid #eee', borderRadius: 1 }}>
                <Typography variant="subtitle2">Connected Organizer:</Typography>
                <Typography variant="body2">
                  <strong>ID:</strong> {typeof user.regionalOrganizerInfo.organizerId === 'object' 
                    ? user.regionalOrganizerInfo.organizerId._id 
                    : user.regionalOrganizerInfo.organizerId}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </TabPanel>

      {/* Admin Status Tab */}
      <TabPanel value={tabValue} index={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Admin Status</Typography>
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={getNestedValue(user, 'localAdminInfo.isApproved', false)}
                  onChange={handleToggleChange('localAdminInfo.isApproved')}
                  color="primary"
                />
              }
              label="Approved as Admin"
            />
            
            <FormControlLabel
              control={
                <Switch 
                  checked={getNestedValue(user, 'localAdminInfo.isEnabled', false)}
                  onChange={handleToggleChange('localAdminInfo.isEnabled')}
                  color="primary"
                />
              }
              label="Enabled as Admin"
            />
            
            {/* Read-only Active status */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
              <Chip 
                label={getNestedValue(user, 'localAdminInfo.isActive', false) ? "Active" : "Inactive"} 
                color={getNestedValue(user, 'localAdminInfo.isActive', false) ? "success" : "default"}
                size="small"
              />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (auto-configured based on approval and enabled status)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </TabPanel>

      {/* Advanced Tab */}
      <TabPanel value={tabValue} index={5}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Advanced Settings</Typography>
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>App ID</Typography>
              <TextField
                fullWidth
                size="small"
                name="appId"
                value={user.appId || '1'}
                onChange={handleTextChange}
                disabled
                helperText="Application identifier (read-only)"
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>Creation Date</Typography>
              <TextField
                fullWidth
                size="small"
                value={user.createdAt ? new Date(user.createdAt).toLocaleString() : 'Unknown'}
                disabled
                helperText="Date when this user was created"
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>Last Updated</Typography>
              <TextField
                fullWidth
                size="small"
                value={user.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'Unknown'}
                disabled
                helperText="Date when this user was last updated"
              />
            </Box>
          </Box>
        </Paper>
      </TabPanel>

      {/* Save button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={<SaveIcon />}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

UserEditForm.propTypes = {
  /**
   * User object containing all user data
   */
  user: PropTypes.shape({
    _id: PropTypes.string,
    firebaseUserId: PropTypes.string,
    appId: PropTypes.string,
    active: PropTypes.bool,
    roleIds: PropTypes.array,
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
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
   * Array of available roles
   */
  roles: PropTypes.array.isRequired,
  
  /**
   * Callback function when a field is changed
   */
  onChange: PropTypes.func.isRequired,
  
  /**
   * Callback function when form is submitted
   */
  onSubmit: PropTypes.func.isRequired,
  
  /**
   * Loading state to disable form submission
   */
  loading: PropTypes.bool
};

UserEditForm.defaultProps = {
  loading: false
};

export default UserEditForm;