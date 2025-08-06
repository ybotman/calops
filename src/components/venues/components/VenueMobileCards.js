'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Collapse,
  Button,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import MyLocationIcon from '@mui/icons-material/MyLocation';

/**
 * VenueMobileCards component
 * Mobile-friendly card layout for displaying venues
 */
const VenueMobileCards = ({
  venues = [],
  loading = false,
  onEdit,
  onDelete,
  onValidateGeo,
  onFindMastered,
  onGeocodeAddress
}) => {
  const [expandedCards, setExpandedCards] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState({});

  const handleExpandClick = (venueId) => {
    setExpandedCards(prev => ({
      ...prev,
      [venueId]: !prev[venueId]
    }));
  };

  const handleMenuOpen = (event, venue) => {
    setAnchorEl(event.currentTarget);
    setSelectedVenue(venue);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVenue(null);
  };

  const handleAction = (action) => {
    if (selectedVenue) {
      action(selectedVenue);
    }
    handleMenuClose();
  };

  const handleGeoAction = async (venue, action, actionType) => {
    const venueId = venue._id || venue.id;
    setLoadingGeo({ ...loadingGeo, [venueId]: actionType });
    try {
      await action(venue);
    } finally {
      setLoadingGeo({ ...loadingGeo, [venueId]: null });
    }
  };

  const formatAddress = (venue) => {
    const parts = [];
    if (venue.address1 || venue.address?.street1) {
      parts.push(venue.address1 || venue.address.street1);
    }
    if (venue.city || venue.address?.city) {
      parts.push(venue.city || venue.address.city);
    }
    if (venue.state || venue.address?.state) {
      parts.push(venue.state || venue.address.state);
    }
    if (venue.zip || venue.address?.zip || venue.postalCode) {
      parts.push(venue.zip || venue.address?.zip || venue.postalCode);
    }
    return parts.join(', ') || 'No address';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (venues.length === 0) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center' }}>
        No venues found
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Stack spacing={2}>
        {venues.map((venue) => {
          const venueId = venue._id || venue.id;
          const isExpanded = expandedCards[venueId];
          const isLoadingGeo = loadingGeo[venueId];

          return (
            <Card key={venueId} elevation={2}>
              <CardContent sx={{ pb: 1 }}>
                {/* Primary Info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                      {venue.name || venue.displayName || 'Unnamed Venue'}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ fontSize: '0.85rem' }}>
                      {venue.shortName || (venue.name ? venue.name.substring(0, 15) : 'N/A')}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, venue)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Address */}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <LocationOnIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  {formatAddress(venue)}
                </Typography>

                {/* Status Chips */}
                <Box sx={{ my: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {venue.hasValidGeo ? (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Valid Geo" 
                      color="success" 
                      size="small" 
                      variant="outlined"
                    />
                  ) : (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label="Needs Validation" 
                      color="warning" 
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {venue.masteredCityName && (
                    <Chip 
                      label={venue.masteredCityName}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Geo Actions */}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                  <Tooltip title="Find nearest mastered city">
                    <span>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleGeoAction(venue, onFindMastered, 'mastered')}
                        disabled={!venue.latitude || !venue.longitude || isLoadingGeo === 'mastered'}
                        startIcon={isLoadingGeo === 'mastered' ? 
                          <CircularProgress size={16} /> : 
                          <LocationSearchingIcon />
                        }
                      >
                        Find City
                      </Button>
                    </span>
                  </Tooltip>
                  {onGeocodeAddress && (
                    <Tooltip title="Geocode from address">
                      <span>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleGeoAction(venue, onGeocodeAddress, 'geocode')}
                          disabled={(!venue.address1 && !venue.city) || isLoadingGeo === 'geocode'}
                          startIcon={isLoadingGeo === 'geocode' ? 
                            <CircularProgress size={16} /> : 
                            <MyLocationIcon />
                          }
                        >
                          Geocode
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>

                {/* Expandable Details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mt: 1 }}>
                    {venue.address2 && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Address 2:</strong> {venue.address2}
                      </Typography>
                    )}
                    {(venue.latitude && venue.longitude) && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Coordinates:</strong> {venue.latitude.toFixed(4)}, {venue.longitude.toFixed(4)}
                      </Typography>
                    )}
                    {venue.masteredDivisionName && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Division:</strong> {venue.masteredDivisionName}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>ID:</strong> {venueId}
                    </Typography>
                  </Box>
                </Collapse>
              </CardContent>

              <CardActions sx={{ px: 2, py: 1 }}>
                <Button
                  size="small"
                  onClick={() => handleExpandClick(venueId)}
                  startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {isExpanded ? 'Less' : 'More'}
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Stack>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAction(onEdit)}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Venue
        </MenuItem>
        {onValidateGeo && (
          <MenuItem onClick={() => handleAction(onValidateGeo)}>
            <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
            Validate Geo
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete Venue
        </MenuItem>
      </Menu>
    </Box>
  );
};

VenueMobileCards.propTypes = {
  venues: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onValidateGeo: PropTypes.func,
  onFindMastered: PropTypes.func,
  onGeocodeAddress: PropTypes.func
};

export default VenueMobileCards;