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
import MasteredLocationSelector from '@/components/common/MasteredLocationSelector';

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
 * Provides a comprehensive tabbed interface for editing user details, roles, and permissions
 */
const UserEditForm = ({ user, roles, onChange, onSubmit, loading = false }) => {
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
        <Tab label="Roles" id="user-edit-tab-0" />
        <Tab label="Firebase Info" id="user-edit-tab-1" />
        <Tab label="Local User Info" id="user-edit-tab-2" />
        <Tab label="Regional Organizer" id="user-edit-tab-3" />
        <Tab label="Local Admin" id="user-edit-tab-4" />
      </Tabs>

      {/* Roles Tab */}
      <TabPanel value={tabValue} index={0}>
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

      {/* Firebase Info Tab */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Firebase User Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Firebase User ID"
                value={firebaseUserId}
                disabled
                helperText="Unique Firebase identifier (read-only)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="firebaseUserInfo.email"
                value={getNestedValue(user, 'firebaseUserInfo.email', '')}
                onChange={handleTextChange}
                helperText="User's email address from Firebase"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Display Name"
                name="firebaseUserInfo.displayName"
                value={getNestedValue(user, 'firebaseUserInfo.displayName', '')}
                onChange={handleTextChange}
                helperText="User's display name from Firebase"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Last Firebase Sync"
                value={getNestedValue(user, 'firebaseUserInfo.lastSyncedAt') 
                  ? new Date(user.firebaseUserInfo.lastSyncedAt).toLocaleString() 
                  : 'Never synced'}
                disabled
                helperText="Last time Firebase data was synchronized"
              />
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      {/* Local User Info Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Local User Information</Typography>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Login User Name"
                name="localUserInfo.loginUserName"
                value={getNestedValue(user, 'localUserInfo.loginUserName', '')}
                onChange={handleTextChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>User Status</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
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
            </Grid>
            <Grid item xs={12} sm={4}>
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
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={user.active !== false}
                    onChange={handleToggleChange('active')}
                    color="primary"
                  />
                }
                label="User Active"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Computed Status:</Typography>
                <Chip 
                  label={getNestedValue(user, 'localUserInfo.isActive', false) ? "Active" : "Inactive"} 
                  color={getNestedValue(user, 'localUserInfo.isActive', false) ? "success" : "default"}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (auto-configured based on approval and enabled status)
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      {/* Regional Organizer Tab */}
      <TabPanel value={tabValue} index={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Regional Organizer Information</Typography>
          <Grid container spacing={2}>
            {/* Organizer Status Flags */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Organizer Status</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={getNestedValue(user, 'regionalOrganizerInfo.isApproved', false)}
                    onChange={handleToggleChange('regionalOrganizerInfo.isApproved')}
                    color="primary"
                  />
                }
                label="Approved"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={getNestedValue(user, 'regionalOrganizerInfo.isEnabled', false)}
                    onChange={handleToggleChange('regionalOrganizerInfo.isEnabled')}
                    color="primary"
                  />
                }
                label="Enabled"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
                <Chip 
                  label={getNestedValue(user, 'regionalOrganizerInfo.isActive', false) ? "Active" : "Inactive"} 
                  color={getNestedValue(user, 'regionalOrganizerInfo.isActive', false) ? "success" : "default"}
                  size="small"
                />
              </Box>
            </Grid>
            
            {/* Connected Organizer ID */}
            {getNestedValue(user, 'regionalOrganizerInfo.organizerId') && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 1.5, border: '1px solid #eee', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Connected Organizer:</Typography>
                  <Typography variant="body2">
                    <strong>ID:</strong> {typeof user.regionalOrganizerInfo.organizerId === 'object' 
                      ? user.regionalOrganizerInfo.organizerId._id 
                      : user.regionalOrganizerInfo.organizerId}
                  </Typography>
                </Box>
              </Grid>
            )}
            
            {/* Allowed Mastered Locations */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Allowed Mastered Locations</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <MasteredLocationSelector
                level="regions"
                selectedIds={getNestedValue(user, 'regionalOrganizerInfo.allowedMasteredRegionIds', []).map(id => 
                  typeof id === 'object' ? id._id : id
                )}
                onChange={(newIds) => {
                  if (typeof onChange === 'function') {
                    onChange('regionalOrganizerInfo.allowedMasteredRegionIds', newIds);
                  }
                }}
                label="Allowed Regions"
                appId={user.appId || '1'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MasteredLocationSelector
                level="divisions"
                selectedIds={getNestedValue(user, 'regionalOrganizerInfo.allowedMasteredDivisionIds', []).map(id => 
                  typeof id === 'object' ? id._id : id
                )}
                onChange={(newIds) => {
                  if (typeof onChange === 'function') {
                    onChange('regionalOrganizerInfo.allowedMasteredDivisionIds', newIds);
                  }
                }}
                label="Allowed Divisions"
                appId={user.appId || '1'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MasteredLocationSelector
                level="cities"
                selectedIds={getNestedValue(user, 'regionalOrganizerInfo.allowedMasteredCityIds', []).map(id => 
                  typeof id === 'object' ? id._id : id
                )}
                onChange={(newIds) => {
                  if (typeof onChange === 'function') {
                    onChange('regionalOrganizerInfo.allowedMasteredCityIds', newIds);
                  }
                }}
                label="Allowed Cities"
                appId={user.appId || '1'}
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>

      {/* Local Admin Tab */}
      <TabPanel value={tabValue} index={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Local Admin Information</Typography>
          <Grid container spacing={2}>
            {/* Admin Status Flags */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Admin Status</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={getNestedValue(user, 'localAdminInfo.isApproved', false)}
                    onChange={handleToggleChange('localAdminInfo.isApproved')}
                    color="primary"
                  />
                }
                label="Approved"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={getNestedValue(user, 'localAdminInfo.isEnabled', false)}
                    onChange={handleToggleChange('localAdminInfo.isEnabled')}
                    color="primary"
                  />
                }
                label="Enabled"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
                <Chip 
                  label={getNestedValue(user, 'localAdminInfo.isActive', false) ? "Active" : "Inactive"} 
                  color={getNestedValue(user, 'localAdminInfo.isActive', false) ? "success" : "default"}
                  size="small"
                />
              </Box>
            </Grid>
            
            {/* Allowed Admin Mastered Locations */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Allowed Admin Mastered Locations</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <MasteredLocationSelector
                level="regions"
                selectedIds={getNestedValue(user, 'localAdminInfo.allowedAdminMasteredRegionIds', []).map(id => 
                  typeof id === 'object' ? id._id : id
                )}
                onChange={(newIds) => {
                  if (typeof onChange === 'function') {
                    onChange('localAdminInfo.allowedAdminMasteredRegionIds', newIds);
                  }
                }}
                label="Admin Regions"
                appId={user.appId || '1'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MasteredLocationSelector
                level="divisions"
                selectedIds={getNestedValue(user, 'localAdminInfo.allowedAdminMasteredDivisionIds', []).map(id => 
                  typeof id === 'object' ? id._id : id
                )}
                onChange={(newIds) => {
                  if (typeof onChange === 'function') {
                    onChange('localAdminInfo.allowedAdminMasteredDivisionIds', newIds);
                  }
                }}
                label="Admin Divisions"
                appId={user.appId || '1'}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MasteredLocationSelector
                level="cities"
                selectedIds={getNestedValue(user, 'localAdminInfo.allowedAdminMasteredCityIds', []).map(id => 
                  typeof id === 'object' ? id._id : id
                )}
                onChange={(newIds) => {
                  if (typeof onChange === 'function') {
                    onChange('localAdminInfo.allowedAdminMasteredCityIds', newIds);
                  }
                }}
                label="Admin Cities"
                appId={user.appId || '1'}
                size="small"
              />
            </Grid>
            
            {/* User Communication Settings */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Communication Settings</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={getNestedValue(user, 'localAdminInfo.userCommunicationSettings.wantFestivalMessages', false)}
                    onChange={handleToggleChange('localAdminInfo.userCommunicationSettings.wantFestivalMessages')}
                    color="primary"
                  />
                }
                label="Want Festival Messages"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={getNestedValue(user, 'localAdminInfo.userCommunicationSettings.wantWorkshopMessages', false)}
                    onChange={handleToggleChange('localAdminInfo.userCommunicationSettings.wantWorkshopMessages')}
                    color="primary"
                  />
                }
                label="Want Workshop Messages"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Message Primary Method"
                name="localAdminInfo.userCommunicationSettings.messagePrimaryMethod"
                value={getNestedValue(user, 'localAdminInfo.userCommunicationSettings.messagePrimaryMethod', 'app')}
                onChange={handleTextChange}
                SelectProps={{
                  native: true,
                }}
                size="small"
              >
                <option value="app">App</option>
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="social">Social</option>
              </TextField>
            </Grid>
          </Grid>
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
      organizerId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      allowedMasteredRegionIds: PropTypes.array,
      allowedMasteredDivisionIds: PropTypes.array,
      allowedMasteredCityIds: PropTypes.array
    }),
    localAdminInfo: PropTypes.shape({
      isApproved: PropTypes.bool,
      isEnabled: PropTypes.bool,
      isActive: PropTypes.bool,
      allowedAdminMasteredRegionIds: PropTypes.array,
      allowedAdminMasteredDivisionIds: PropTypes.array,
      allowedAdminMasteredCityIds: PropTypes.array
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

export default UserEditForm;