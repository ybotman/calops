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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { formatDistanceToNow } from 'date-fns';

/**
 * UserMobileCards component
 * Mobile-friendly card layout for displaying users
 */
const UserMobileCards = ({
  users,
  loading = false,
  onEdit,
  onDelete,
  onCreateOrganizer,
  onDeleteOrganizer,
  error,
  selectedUser
}) => {
  const [expandedCards, setExpandedCards] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCardUser, setSelectedCardUser] = useState(null);

  const handleExpandClick = (userId) => {
    setExpandedCards(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedCardUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCardUser(null);
  };

  const handleAction = (action) => {
    if (selectedCardUser) {
      action(selectedCardUser);
    }
    handleMenuClose();
  };

  const formatFirebaseId = (firebaseUserId) => {
    if (!firebaseUserId) return 'N/A';
    return firebaseUserId.length > 8 ? `${firebaseUserId.substring(0, 8)}...` : firebaseUserId;
  };

  const formatUpdatedAt = (updatedAt) => {
    if (!updatedAt) return 'Never';
    try {
      const date = new Date(updatedAt);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getRoleChips = (user) => {
    const roles = user.roleNames ? user.roleNames.split(',').map(r => r.trim()) : [];
    return roles.map(role => (
      <Chip 
        key={role} 
        label={role} 
        size="small" 
        color={role === 'SA' ? 'error' : role === 'RA' ? 'warning' : 'default'}
        sx={{ mr: 0.5 }}
      />
    ));
  };

  const getStatusInfo = (user) => {
    const hasRO = user.roleNames?.includes('RO');
    const hasRA = user.roleNames?.includes('RA');
    
    if (hasRO) {
      const roInfo = user.regionalOrganizerInfo || {};
      return {
        enabled: roInfo.isEnabled,
        approved: roInfo.isApproved,
        active: roInfo.isActive,
        type: 'RO'
      };
    }
    
    if (hasRA) {
      const raInfo = user.localAdminInfo || {};
      return {
        enabled: raInfo.isEnabled,
        approved: raInfo.isApproved,
        active: raInfo.isActive,
        type: 'RA'
      };
    }
    
    return null;
  };

  if (loading && !selectedUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 2 }}>
        Error: {error?.message || error?.toString() || 'An error occurred'}
      </Typography>
    );
  }

  if (users.length === 0) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center' }}>
        No users found matching the criteria
      </Typography>
    );
  }

  return (
    <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', sm: 600 }, mx: 'auto' }}>
        <Stack spacing={2}>
          {users.map((user) => {
          const isExpanded = expandedCards[user._id];
          const statusInfo = getStatusInfo(user);
          const hasOrganizerId = user.regionalOrganizerInfo?.organizerId;

          return (
            <Card key={user._id} elevation={2}>
              <CardContent sx={{ pb: 1 }}>
                {/* Primary Info */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem' }}>
                      {user.displayName || 'Unnamed User'}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {user.email}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, user)}
                    sx={{ ml: 1 }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Roles and Status */}
                <Box sx={{ my: 1 }}>
                  {getRoleChips(user)}
                  {hasOrganizerId && (
                    <Chip 
                      label="Has Org" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                      sx={{ ml: 0.5 }}
                    />
                  )}
                </Box>

                {/* Status Info if RO/RA */}
                {statusInfo && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={statusInfo.enabled ? 'Enabled' : 'Disabled'} 
                      size="small" 
                      color={statusInfo.enabled ? 'success' : 'default'}
                      variant="outlined"
                    />
                    <Chip 
                      label={statusInfo.approved ? 'Approved' : 'Not Approved'} 
                      size="small" 
                      color={statusInfo.approved ? 'success' : 'default'}
                      variant="outlined"
                    />
                    <Chip 
                      label={statusInfo.active ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={statusInfo.active ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                )}

                {/* Expandable Details */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Firebase ID:</strong> {formatFirebaseId(user.firebaseUserId)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Updated:</strong> {formatUpdatedAt(user.updatedAt)}
                    </Typography>
                    {hasOrganizerId && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Organizer ID:</strong> {user.regionalOrganizerInfo.organizerId}
                      </Typography>
                    )}
                  </Box>
                </Collapse>
              </CardContent>

              <CardActions sx={{ px: 2, py: 1 }}>
                <Button
                  size="small"
                  onClick={() => handleExpandClick(user._id)}
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
          Edit User
        </MenuItem>
        {onCreateOrganizer && selectedCardUser && !selectedCardUser.regionalOrganizerInfo?.organizerId && (
          <MenuItem onClick={() => handleAction(onCreateOrganizer)}>
            <PersonAddIcon sx={{ mr: 1, fontSize: 20 }} />
            Create Organizer
          </MenuItem>
        )}
        {onDeleteOrganizer && selectedCardUser && selectedCardUser.regionalOrganizerInfo?.organizerId && (
          <MenuItem onClick={() => handleAction(onDeleteOrganizer)}>
            <PersonRemoveIcon sx={{ mr: 1, fontSize: 20 }} />
            Delete Organizer
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => handleAction(onDelete)} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete User
        </MenuItem>
      </Menu>
      </Box>
    </Paper>
  );
};

UserMobileCards.propTypes = {
  users: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCreateOrganizer: PropTypes.func,
  onDeleteOrganizer: PropTypes.func,
  error: PropTypes.string,
  selectedUser: PropTypes.object
};

export default UserMobileCards;