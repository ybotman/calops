'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

export default function OrganizerEditForm({ organizer, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    isActive: true,
    isApproved: false,
    isEnabled: false,
    contactInfo: {
      email: '',
      phone: '',
      website: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with organizer data
  useEffect(() => {
    if (organizer) {
      setFormData({
        _id: organizer._id,
        appId: organizer.appId || '1', // Ensure appId is included
        name: organizer.name || organizer.fullName || '', // Handle either name format
        fullName: organizer.fullName || organizer.name || '', // Make sure fullName is set 
        shortName: organizer.shortName || '',
        description: organizer.description || '',
        isActive: organizer.isActive === true ? true : false,
        isApproved: organizer.isApproved === true ? true : false,
        isEnabled: organizer.isEnabled === true ? true : false,
        contactInfo: {
          email: organizer.contactInfo?.email || '',
          phone: organizer.contactInfo?.phone || '',
          website: organizer.contactInfo?.website || '',
        },
        address: {
          street: organizer.address?.street || '',
          city: organizer.address?.city || '',
          state: organizer.address?.state || '',
          postalCode: organizer.address?.postalCode || '',
          country: organizer.address?.country || '',
        },
        // Add missing fields required by backend
        organizerRegion: organizer.organizerRegion || "66c4d99042ec462ea22484bd", // Default US region
        linkedUserLogin: organizer.linkedUserLogin || null, // Include the linked user if any
        wantRender: organizer.wantRender !== false, // Default to true if not specified
        organizerTypes: organizer.organizerTypes || {
          isEventOrganizer: true,
          isVenue: false,
          isTeacher: false,
          isMaestro: false,
          isDJ: false,
          isOrchestra: false
        }
      });
      
      console.log('Loaded organizer with:', {
        name: organizer.name,
        fullName: organizer.fullName,
        shortName: organizer.shortName
      });
      
      console.log('Initialized form data with:', {
        _id: organizer._id,
        appId: organizer.appId || '1',
        organizerRegion: organizer.organizerRegion || "66c4d99042ec462ea22484bd"
      });
    }
  }, [organizer]);

  // Validate shortName format
  const validateShortName = (value) => {
    // Must be <= 10 chars, no spaces, uppercase only, and only allows !?-_
    const regex = /^[A-Z0-9!?\-_]{1,10}$/;
    return regex.test(value);
  };

  // Format shortName to match requirements
  const formatShortName = (value) => {
    // Remove spaces, convert to uppercase
    return value.replace(/\s+/g, '').toUpperCase().substring(0, 10);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    // Special handling for shortName
    if (name === 'shortName') {
      const formattedValue = formatShortName(value);
      setFormData(prev => ({
        ...prev,
        shortName: formattedValue
      }));
      return;
    }
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: e.target.type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle top-level fields
      setFormData(prev => ({
        ...prev,
        [name]: e.target.type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate shortName
    if (formData.shortName && !validateShortName(formData.shortName)) {
      setError('Short Name must be uppercase with no spaces (max 10 chars, only letters, numbers, !?-_)');
      return;
    }
    
    setLoading(true);
    
    try {
      // Ensure all fields are properly formatted before submission
      const updatedData = {
        ...formData,
        // MongoDB backend actually uses fullName (not name)
        fullName: formData.name,
        name: formData.name,
        // Make sure shortName exists and is formatted correctly
        shortName: formatShortName(formData.shortName || formData.name.substring(0, 10)),
        // Ensure boolean fields are explicitly true or false
        isApproved: formData.isApproved === true ? true : false,
        isActive: formData.isActive === true ? true : false,
        isEnabled: formData.isEnabled === true ? true : false
      };
      
      console.log('Submitting organizer data:', updatedData);
      
      // Call the onSubmit function passed as prop
      await onSubmit(updatedData);
    } catch (err) {
      setError('Failed to update organizer. Please try again.');
      console.error('Error in organizer update:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      {/* Basic Organizer Information */}
      <Typography variant="h6" gutterBottom>Basic Information</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Short Name (UPPERCASE, max 10 chars)"
            name="shortName"
            value={formData.shortName}
            onChange={handleChange}
            required
            inputProps={{ 
              maxLength: 10,
              style: { textTransform: 'uppercase' } 
            }}
            helperText="No spaces, letters, numbers, and !?-_ only"
            error={formData.shortName.length > 0 && !validateShortName(formData.shortName)}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch 
                checked={formData.isActive} 
                onChange={handleChange}
                name="isActive"
                color="primary"
              />
            }
            label="Active"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch 
                checked={formData.isApproved} 
                onChange={handleChange}
                name="isApproved"
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
                checked={formData.isEnabled} 
                onChange={handleChange}
                name="isEnabled"
                color="primary"
              />
            }
            label="Enabled"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Contact Information */}
      <Typography variant="h6" gutterBottom>Contact Information</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Email"
            name="contactInfo.email"
            value={formData.contactInfo.email}
            onChange={handleChange}
            type="email"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Phone"
            name="contactInfo.phone"
            value={formData.contactInfo.phone}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Website"
            name="contactInfo.website"
            value={formData.contactInfo.website}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Address Information */}
      <Typography variant="h6" gutterBottom>Address</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Street"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="State/Province"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Postal Code"
            name="address.postalCode"
            value={formData.address.postalCode}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Country"
            name="address.country"
            value={formData.address.country}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
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
}