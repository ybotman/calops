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
  ListItemIcon,
  ListItemText,
  Stack,
  Paper
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import { format } from 'date-fns';

/**
 * Format date for display
 */
const formatDate = (dateStr) => {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch (e) {
    return 'Invalid date';
  }
};

const formatTime = (dateStr) => {
  try {
    return format(new Date(dateStr), 'h:mm a');
  } catch (e) {
    return '';
  }
};

/**
 * EventMobileCards component
 * Mobile-friendly card layout for displaying events
 */
const EventMobileCards = ({
  events,
  loading = false,
  error,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const [expandedCards, setExpandedCards] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleExpandClick = (eventId) => {
    setExpandedCards(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };

  const handleMenuOpen = (event, eventData) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventData);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleAction = (action) => {
    if (!selectedEvent) return;

    switch (action) {
      case 'view':
        onView && onView(selectedEvent._id);
        break;
      case 'edit':
        onEdit && onEdit(selectedEvent._id);
        break;
      case 'delete':
        onDelete && onDelete(selectedEvent._id);
        break;
      case 'toggle':
        onToggleStatus && onToggleStatus(selectedEvent._id, !selectedEvent.active);
        break;
      default:
        break;
    }

    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: '#fff9f9' }}>
        <Typography color="error">Error loading events: {error}</Typography>
      </Paper>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          No events found matching your filter criteria.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Stack spacing={2}>
        {events.map((event) => {
          const isExpanded = expandedCards[event._id];

          return (
            <Card key={event._id} elevation={2}>
              <CardContent sx={{ pb: 1 }}>
                {/* Header with title and menu */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1, pr: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {event.title || 'Untitled Event'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {event.shortDescription || event.description?.substring(0, 100) || 'No description'}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, event)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Date and Time */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <EventIcon fontSize="small" color="action" />
                  <Typography variant="body2">
                    {formatDate(event.startDate)} {formatTime(event.startDate)}
                  </Typography>
                </Box>

                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" noWrap>
                    {event.location?.venueName || 'N/A'}
                    {(event.masteredCityName || event.location?.city) &&
                      `, ${event.masteredCityName || event.location?.city}`}
                  </Typography>
                </Box>

                {/* Status chips */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                  <Chip
                    size="small"
                    label={event.active ? 'Active' : 'Inactive'}
                    color={event.active ? 'success' : 'default'}
                    icon={event.active ? <CheckCircleIcon /> : <CancelIcon />}
                  />
                  {event.isFeatured && (
                    <Chip
                      size="small"
                      label="Featured"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {event.categoryName && (
                    <Chip
                      size="small"
                      label={event.categoryName}
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Expandable details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ mt: 1 }}>
                    {/* Organizer */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        <strong>Organizer:</strong> {event.organizer?.name || 'N/A'}
                      </Typography>
                    </Box>

                    {/* End date */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>End:</strong> {formatDate(event.endDate)} {formatTime(event.endDate)}
                    </Typography>

                    {/* Region */}
                    {event.masteredRegionName && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Region:</strong> {event.masteredRegionName}
                      </Typography>
                    )}

                    {/* Full description if longer */}
                    {event.description && event.description.length > 100 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {event.description}
                      </Typography>
                    )}

                    {/* Event ID */}
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                      ID: {event._id}
                    </Typography>
                  </Box>
                </Collapse>
              </CardContent>

              <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  onClick={() => handleExpandClick(event._id)}
                  startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {isExpanded ? 'Less' : 'More'}
                </Button>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => { setSelectedEvent(event); handleAction('edit'); }}
                    color="primary"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
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
        <MenuItem onClick={() => handleAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('toggle')}>
          <ListItemIcon>
            {selectedEvent?.active ? (
              <CancelIcon fontSize="small" />
            ) : (
              <CheckCircleIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {selectedEvent?.active ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

EventMobileCards.propTypes = {
  events: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onView: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleStatus: PropTypes.func
};

export default EventMobileCards;
