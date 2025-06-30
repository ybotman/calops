import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  addOrganizerRegionPermission, 
  removeOrganizerRegionPermission,
  addAdminRegionPermission,
  removeAdminRegionPermission,
  getOrganizerAllowedRegions,
  getAdminAllowedRegions
} from '@/lib/permissions';

export default function RegionPermissionsModal({ 
  open, 
  onClose, 
  userLogin, 
  onUpdate,
  isAdmin = false 
}) {
  const [regions, setRegions] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load available regions on mount
  useEffect(() => {
    if (open) {
      loadRegions();
      loadUserRegions();
    }
  }, [open, userLogin, isAdmin]);

  const loadRegions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backend/masteredLocations/regions?appId=1');
      if (!response.ok) throw new Error('Failed to load regions');
      
      const data = await response.json();
      setRegions(data);
    } catch (err) {
      setError('Failed to load regions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRegions = () => {
    if (!userLogin) return;
    
    const currentRegions = isAdmin 
      ? getAdminAllowedRegions(userLogin)
      : getOrganizerAllowedRegions(userLogin);
    
    setSelectedRegions(currentRegions.map(id => id.toString()));
  };

  const handleRegionToggle = (regionId) => {
    setSelectedRegions(prev => {
      if (prev.includes(regionId)) {
        return prev.filter(id => id !== regionId);
      } else {
        return [...prev, regionId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Update the userLogin object locally
      const updatedUserLogin = { ...userLogin };
      
      // Clear and rebuild permissions
      if (isAdmin) {
        if (!updatedUserLogin.localAdminInfo) {
          updatedUserLogin.localAdminInfo = {
            isApproved: false,
            isEnabled: false,
            isActive: false,
            allowedAdminMasteredRegionIds: []
          };
        }
        updatedUserLogin.localAdminInfo.allowedAdminMasteredRegionIds = selectedRegions;
      } else {
        if (!updatedUserLogin.regionalOrganizerInfo) {
          updatedUserLogin.regionalOrganizerInfo = {
            isApproved: false,
            isEnabled: false,
            isActive: false,
            allowedMasteredRegionIds: []
          };
        }
        updatedUserLogin.regionalOrganizerInfo.allowedMasteredRegionIds = selectedRegions;
      }

      // Save to backend
      const response = await fetch(`/api/backend/userlogins/${userLogin._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserLogin)
      });

      if (!response.ok) {
        throw new Error('Failed to update user permissions');
      }

      // Call parent callback with updated user
      onUpdate(updatedUserLogin);
      onClose();
    } catch (err) {
      setError('Failed to save permissions: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRegionName = (regionId) => {
    const region = regions.find(r => r._id === regionId);
    return region ? region.regionName : regionId;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isAdmin ? 'Admin' : 'Organizer'} Region Permissions for {userLogin?.firebaseUserInfo?.displayName || userLogin?.firebaseUserInfo?.email}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which regions this {isAdmin ? 'admin' : 'organizer'} can access:
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {regions.map((region) => (
                <FormControlLabel
                  key={region._id}
                  control={
                    <Checkbox
                      checked={selectedRegions.includes(region._id)}
                      onChange={() => handleRegionToggle(region._id)}
                      disabled={saving}
                    />
                  }
                  label={region.regionName}
                />
              ))}
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Currently selected regions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selectedRegions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No regions selected
                  </Typography>
                ) : (
                  selectedRegions.map((regionId) => (
                    <Chip
                      key={regionId}
                      label={getRegionName(regionId)}
                      size="small"
                      onDelete={() => handleRegionToggle(regionId)}
                      disabled={saving}
                    />
                  ))
                )}
              </Box>
            </Box>

            {!isAdmin && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Note: The user must also have their regionalOrganizerInfo flags (isApproved, isEnabled, isActive) set to true for these permissions to be effective.
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || saving}
        >
          {saving ? 'Saving...' : 'Save Permissions'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}