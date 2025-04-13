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
        name: organizer.name || '',
        fullName: organizer.fullName || organizer.name || '', // Make sure fullName is set 
        shortName: organizer.shortName || '',
        description: organizer.description || '',
        isActive: organizer.isActive !== false, // Default to true if undefined
        isApproved: organizer.isApproved || false,
        isEnabled: organizer.isEnabled || false,
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
      
      console.log('Initialized form data with:', {
        _id: organizer._id,
        appId: organizer.appId || '1',
        organizerRegion: organizer.organizerRegion || "66c4d99042ec462ea22484bd"
      });
    }
  }, [organizer]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
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
    setLoading(true);
    setError('');
    
    try {
      // Call the onSubmit function passed as prop
      await onSubmit(formData);
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
            label="Short Name"
            name="shortName"
            value={formData.shortName}
            onChange={handleChange}
            required
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