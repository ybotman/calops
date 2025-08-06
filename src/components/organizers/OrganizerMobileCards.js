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
  Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

/**
 * OrganizerMobileCards component
 * Mobile-friendly card layout for displaying organizers
 */
const OrganizerMobileCards = ({
  organizers,
  loading = false,
  onEdit,
  onDelete,
  onConnect
}) => {
  const [expandedCards, setExpandedCards] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);

  const handleExpandClick = (organizerId) => {
    setExpandedCards(prev => ({
      ...prev,
      [organizerId]: !prev[organizerId]
    }));
  };

  const handleMenuOpen = (event, organizer) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrganizer(organizer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrganizer(null);
  };

  const handleAction = (action) => {
    if (selectedOrganizer) {
      action(selectedOrganizer);
    }
    handleMenuClose();
  };

  const getOrganizerTypes = (organizer) => {
    const types = [];
    if (organizer.organizerTypes?.isVenue) types.push('Venue');
    if (organizer.organizerTypes?.isTeacher) types.push('Teacher');
    if (organizer.organizerTypes?.isMaestro) types.push('Maestro');
    if (organizer.organizerTypes?.isDJ) types.push('DJ');
    if (organizer.organizerTypes?.isOrchestra) types.push('Orchestra');
    return types.length > 0 ? types : ['Event Only'];
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (organizers.length === 0) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center' }}>
        No organizers found
      </Typography>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', sm: 600 }, mx: 'auto' }}>
      <Stack spacing={2}>
        {organizers.map((organizer) => {
          const isExpanded = expandedCards[organizer.id];
          const types = getOrganizerTypes(organizer);

          return (
            <Card key={organizer.id} elevation={2}>
              <CardContent sx={{ pb: 1 }}>
                {/* Primary Info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                      {organizer.displayName || 'Unnamed Organizer'}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {organizer.shortDisplayName || 'No short name'}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, organizer)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Status Chips */}
                <Box sx={{ my: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  <Chip 
                    label={organizer.enabled === 'Yes' ? 'Enabled' : 'Disabled'}
                    size="small"
                    color={organizer.enabled === 'Yes' ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={organizer.approved === 'Yes' ? 'Approved' : 'Not Approved'}
                    size="small"
                    color={organizer.approved === 'Yes' ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={organizer.status === 'Active' ? 'Active' : 'Inactive'}
                    size="small"
                    color={organizer.status === 'Active' ? 'success' : 'default'}
                    variant="outlined"
                  />
                  {organizer.isVisible && (
                    <Chip 
                      icon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                      label="Visible"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Organizer Types */}
                <Box sx={{ my: 1 }}>
                  {types.map(type => (
                    <Chip 
                      key={type}
                      label={type}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>

                {/* Connected User */}
                {organizer.userConnectedName && organizer.userConnectedName !== '-' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    <strong>Connected:</strong> {organizer.userConnectedName}
                  </Typography>
                )}

                {/* Expandable Details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mt: 1 }}>
                    {organizer.cityName && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>City:</strong> {organizer.cityName}
                      </Typography>
                    )}
                    {organizer.divisionName && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Division:</strong> {organizer.divisionName}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      <strong>ID:</strong> {organizer._id}
                    </Typography>
                    {organizer.linkedUserLogin && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>User Login:</strong> {organizer.linkedUserLogin}
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              </CardContent>

              <CardActions sx={{ px: 2, py: 1 }}>
                <Button
                  size="small"
                  onClick={() => handleExpandClick(organizer.id)}
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
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleAction(onConnect)}>
          <LinkIcon sx={{ mr: 1, fontSize: 20 }} />
          Link User
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

OrganizerMobileCards.propTypes = {
  organizers: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onConnect: PropTypes.func.isRequired
};

export default OrganizerMobileCards;