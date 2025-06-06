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
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import SchoolIcon from '@mui/icons-material/School';
import StarIcon from '@mui/icons-material/Star';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

export default function OrganizerEditForm({ organizer, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    description: '',
    isEnabled: false,
    wantRender: false,
    isRendered: false,
    publicContactInfo: {
      Email: '',
      phone: '',
      url: '',
      address: {
        street1: '',
        street2: '',
        city: '',
        state: '',
        postalCode: '',
      },
    },
    organizerTypes: {
      isEventOrganizer: true,
      isVenue: false,
      isTeacher: false,
      isMaestro: false,
      isDJ: false,
      isOrchestra: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with organizer data
  useEffect(() => {
    if (organizer) {
      setFormData({
        _id: organizer._id,
        appId: organizer.appId || '1',
        name: organizer.name || organizer.fullName || '',
        fullName: organizer.fullName || organizer.name || '',
        shortName: organizer.shortName || '',
        description: organizer.description || '',
        isEnabled: organizer.isEnabled === true,
        wantRender: organizer.wantRender === true,
        isRendered: organizer.isRendered === true,
        publicContactInfo: {
          Email: organizer.publicContactInfo?.Email || organizer.contactInfo?.email || '',
          phone: organizer.publicContactInfo?.phone || organizer.contactInfo?.phone || '',
          url: organizer.publicContactInfo?.url || organizer.contactInfo?.website || '',
          address: {
            street1: organizer.publicContactInfo?.address?.street1 || organizer.address?.street || '',
            street2: organizer.publicContactInfo?.address?.street2 || '',
            city: organizer.publicContactInfo?.address?.city || organizer.address?.city || '',
            state: organizer.publicContactInfo?.address?.state || organizer.address?.state || '',
            postalCode: organizer.publicContactInfo?.address?.postalCode || organizer.address?.postalCode || '',
          },
        },
        organizerTypes: {
          isEventOrganizer: true, // Always true, cannot be changed
          isVenue: organizer.organizerTypes?.isVenue || false,
          isTeacher: organizer.organizerTypes?.isTeacher || false,
          isMaestro: organizer.organizerTypes?.isMaestro || false,
          isDJ: organizer.organizerTypes?.isDJ || false,
          isOrchestra: organizer.organizerTypes?.isOrchestra || false
        },
        // Keep these fields from the original but don't display
        organizerRegion: organizer.organizerRegion || "66c4d99042ec462ea22484bd",
        linkedUserLogin: organizer.linkedUserLogin || null,
        wantRender: organizer.wantRender !== false,
        masteredRegionId: organizer.masteredRegionId,
        masteredDivisionId: organizer.masteredDivisionId,
        masteredCityId: organizer.masteredCityId,
      });
    }
  }, [organizer]);

  // Validate shortName format
  const validateShortName = (value) => {
    const regex = /^[A-Z0-9!?\-_]{1,10}$/;
    return regex.test(value);
  };

  // Format shortName to match requirements
  const formatShortName = (value) => {
    return value.replace(/\s+/g, '').toUpperCase().substring(0, 10);
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
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
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: e.target.type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, subParent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [subParent]: {
              ...prev[parent][subParent],
              [child]: value
            }
          }
        }));
      }
    } else {
      // Handle top-level fields
      setFormData(prev => ({
        ...prev,
        [name]: e.target.type === 'checkbox' ? checked : value
      }));
    }
  };

  // Handle organizer type toggles
  const handleOrganizerTypeChange = (type) => {
    // Don't allow changing isEventOrganizer
    if (type === 'isEventOrganizer') return;
    
    setFormData(prev => ({
      ...prev,
      organizerTypes: {
        ...prev.organizerTypes,
        [type]: !prev.organizerTypes[type]
      }
    }));
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
      // Prepare the update data with proper structure
      const updatedData = {
        _id: formData._id,
        appId: formData.appId,
        fullName: formData.name,
        shortName: formatShortName(formData.shortName || formData.name.substring(0, 10)),
        description: formData.description,
        isEnabled: formData.isEnabled,
        wantRender: formData.wantRender,
        publicContactInfo: formData.publicContactInfo,
        organizerTypes: formData.organizerTypes,
        // Include hidden fields
        organizerRegion: formData.organizerRegion,
        linkedUserLogin: formData.linkedUserLogin,
        masteredRegionId: formData.masteredRegionId,
        masteredDivisionId: formData.masteredDivisionId,
        masteredCityId: formData.masteredCityId,
      };
      
      console.log('Submitting organizer data:', updatedData);
      
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
                checked={formData.isEnabled} 
                onChange={handleChange}
                name="isEnabled"
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
                checked={formData.wantRender} 
                onChange={handleChange}
                name="wantRender"
                color="primary"
              />
            }
            label="Want Render"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch 
                checked={formData.isRendered} 
                disabled
                name="isRendered"
                color="primary"
              />
            }
            label={`Rendered: ${formData.isRendered ? 'Yes' : 'No'}`}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Organizer Types */}
      <Typography variant="h6" gutterBottom>Organizer Types</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'not-allowed',
              opacity: 0.8,
              bgcolor: 'action.selected'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                Event Organizer
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (Always enabled)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              bgcolor: formData.organizerTypes.isVenue ? 'primary.light' : 'background.paper',
              '&:hover': { bgcolor: formData.organizerTypes.isVenue ? 'primary.main' : 'action.hover' }
            }}
            onClick={() => handleOrganizerTypeChange('isVenue')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <PlaceIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                Venue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              bgcolor: formData.organizerTypes.isTeacher ? 'primary.light' : 'background.paper',
              '&:hover': { bgcolor: formData.organizerTypes.isTeacher ? 'primary.main' : 'action.hover' }
            }}
            onClick={() => handleOrganizerTypeChange('isTeacher')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                Teacher
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              bgcolor: formData.organizerTypes.isMaestro ? 'primary.light' : 'background.paper',
              '&:hover': { bgcolor: formData.organizerTypes.isMaestro ? 'primary.main' : 'action.hover' }
            }}
            onClick={() => handleOrganizerTypeChange('isMaestro')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                Maestro
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              bgcolor: formData.organizerTypes.isDJ ? 'primary.light' : 'background.paper',
              '&:hover': { bgcolor: formData.organizerTypes.isDJ ? 'primary.main' : 'action.hover' }
            }}
            onClick={() => handleOrganizerTypeChange('isDJ')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <HeadphonesIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                DJ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              bgcolor: formData.organizerTypes.isOrchestra ? 'primary.light' : 'background.paper',
              '&:hover': { bgcolor: formData.organizerTypes.isOrchestra ? 'primary.main' : 'action.hover' }
            }}
            onClick={() => handleOrganizerTypeChange('isOrchestra')}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <MusicNoteIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body1" fontWeight="bold">
                Orchestra
              </Typography>
            </CardContent>
          </Card>
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
            name="publicContactInfo.Email"
            value={formData.publicContactInfo.Email}
            onChange={handleChange}
            type="email"
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Phone"
            name="publicContactInfo.phone"
            value={formData.publicContactInfo.phone}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Website"
            name="publicContactInfo.url"
            value={formData.publicContactInfo.url}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Address Information */}
      <Typography variant="h6" gutterBottom>Address</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Street Address 1"
            name="publicContactInfo.address.street1"
            value={formData.publicContactInfo.address.street1}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Street Address 2"
            name="publicContactInfo.address.street2"
            value={formData.publicContactInfo.address.street2}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="City"
            name="publicContactInfo.address.city"
            value={formData.publicContactInfo.address.city}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="State/Province"
            name="publicContactInfo.address.state"
            value={formData.publicContactInfo.address.state}
            onChange={handleChange}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Postal Code"
            name="publicContactInfo.address.postalCode"
            value={formData.publicContactInfo.address.postalCode}
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