'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  CircularProgress
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';

// Helper function to format date
const formatDate = (dateStr) => {
  try {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  } catch (e) {
    return 'Invalid date';
  }
};

// Status chip component
const StatusChip = ({ active }) => {
  return active ? (
    <Chip 
      size="small" 
      label="Active" 
      color="success" 
      icon={<CheckCircleIcon fontSize="small" />} 
    />
  ) : (
    <Chip 
      size="small" 
      label="Inactive" 
      color="default" 
      icon={<CancelIcon fontSize="small" />} 
    />
  );
};

const AllEventsTab = ({ 
  events, 
  loading, 
  error,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  
  // Handle menu opening
  const handleMenuOpen = (event, eventId) => {
    setAnchorEl(event.currentTarget);
    setSelectedEventId(eventId);
  };
  
  // Handle menu closing
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEventId(null);
  };
  
  // Handle action selection
  const handleAction = (action) => {
    if (!selectedEventId) return;
    
    switch (action) {
      case 'view':
        onView && onView(selectedEventId);
        break;
      case 'edit':
        onEdit && onEdit(selectedEventId);
        break;
      case 'delete':
        onDelete && onDelete(selectedEventId);
        break;
      case 'toggle':
        const event = events.find(e => e._id === selectedEventId);
        if (event) {
          onToggleStatus && onToggleStatus(selectedEventId, !event.active);
        }
        break;
      default:
        break;
    }
    
    handleMenuClose();
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading events...</Typography>
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
          {events && events.length === 0 && ' Try adjusting your filters for different results.'}
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Organizer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {event.title}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {event.shortDescription?.substring(0, 50) || 
                     event.description?.substring(0, 50) || 
                     'No description'}
                    {((event.shortDescription && event.shortDescription.length > 50) || 
                      (event.description && event.description.length > 50)) && '...'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(event.startDate)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    to {formatDate(event.endDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {event.location?.venueName || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {event.masteredCityName || event.location?.city}, {event.masteredRegionName || event.location?.region}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {event.organizer?.name || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusChip active={event.active} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Actions">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, event._id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination controls */}
      <TablePagination
        component="div"
        count={pagination?.total || events.length}
        page={pagination?.page ? pagination.page - 1 : 0}
        rowsPerPage={pagination?.limit || 10}
        onPageChange={(e, newPage) => onPageChange && onPageChange(newPage + 1)}
        onRowsPerPageChange={(e) => onRowsPerPageChange && onRowsPerPageChange(parseInt(e.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />
      
      {/* Actions menu */}
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
            {events.find(e => e._id === selectedEventId)?.active ? (
              <CancelIcon fontSize="small" />
            ) : (
              <CheckCircleIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {events.find(e => e._id === selectedEventId)?.active ? 'Deactivate' : 'Activate'}
          </ListItemText>
        </MenuItem>
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

export default AllEventsTab;