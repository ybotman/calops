'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * VenueTable component
 * @param {Object} props - Component props
 * @param {Array} props.venues - Array of venues to display
 * @param {boolean} props.loading - Loading state
 * @param {Object} props.pagination - Pagination state
 * @param {Function} props.onPaginationChange - Pagination change handler
 * @param {Function} props.onEdit - Edit venue handler
 * @param {Function} props.onDelete - Delete venue handler
 * @param {Function} props.onValidateGeo - Validate geo handler
 * @param {Function} props.onFindMastered - Find mastered city handler
 * @param {Function} props.onGeocodeAddress - Geocode address handler
 * @returns {JSX.Element} VenueTable component
 */
const VenueTable = ({
  venues = [],
  loading = false,
  pagination = { page: 0, pageSize: 10, totalCount: 0 },
  onPaginationChange,
  onEdit,
  onDelete,
  onValidateGeo,
  onFindMastered,
  onGeocodeAddress,
  density = 'standard'
}) => {
  // Local state for row actions
  const [hoveredRow, setHoveredRow] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState({});
  
  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    if (onPaginationChange) {
      onPaginationChange(newPage, pagination.pageSize);
    }
  };
  
  const handleChangeRowsPerPage = (event) => {
    const newPageSize = parseInt(event.target.value, 10);
    if (onPaginationChange) {
      onPaginationChange(0, newPageSize);
    }
  };
  
  // Column definitions
  const columns = [
    { id: 'name', label: 'Name', minWidth: 150 },
    { id: 'shortName', label: 'Short', minWidth: 100 },
    { id: 'location', label: 'Address', minWidth: 180 },
    { id: 'city', label: 'City', minWidth: 100 },
    { id: 'state', label: 'State', minWidth: 60 },
    { id: 'zip', label: 'Zip', minWidth: 60 },
    { id: 'masteredCity', label: 'Mastered City', minWidth: 120 },
    { id: 'geoStatus', label: 'Geo Status', minWidth: 100 },
    { id: 'geoActions', label: 'Geo Actions', minWidth: 140 },
    { id: 'actions', label: 'Actions', minWidth: 100, align: 'right' }
  ];
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="venues table" size={density === 'compact' ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body1">Loading venues...</Typography>
                </TableCell>
              </TableRow>
            ) : venues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body1">No venues found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              venues.map((venue) => {
                return (
                  <TableRow
                    hover
                    key={venue._id || venue.id}
                    onMouseEnter={() => setHoveredRow(venue.id || venue._id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {venue.name || venue.displayName || 'Unnamed Venue'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {venue.shortName || (venue.name ? venue.name.substring(0, 15) : 'N/A')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {venue.address1 || venue.address?.street1 || ''}
                        {venue.address2 || venue.address?.street2 ? `, ${venue.address2 || venue.address?.street2}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {venue.city || venue.address?.city || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {venue.state || venue.address?.state || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {venue.zip || venue.address?.zip || venue.postalCode || ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        noWrap
                        sx={{ 
                          color: venue.masteredCityName ? 'text.primary' : 'text.secondary',
                          fontStyle: venue.masteredCityName ? 'normal' : 'italic'
                        }}
                      >
                        {venue.masteredCityName || 'Not Set'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {venue.hasValidGeo ? (
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Valid" 
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
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Find nearest mastered city">
                          <span>
                            <IconButton
                              size="small"
                              onClick={async () => {
                                if (onFindMastered && venue.latitude && venue.longitude) {
                                  setLoadingGeo({ ...loadingGeo, [venue._id || venue.id]: 'mastered' });
                                  try {
                                    await onFindMastered(venue);
                                  } finally {
                                    setLoadingGeo({ ...loadingGeo, [venue._id || venue.id]: null });
                                  }
                                }
                              }}
                              disabled={!venue.latitude || !venue.longitude || loadingGeo[venue._id || venue.id] === 'mastered'}
                            >
                              {loadingGeo[venue._id || venue.id] === 'mastered' ? 
                                <CircularProgress size={18} /> : 
                                <LocationSearchingIcon fontSize="small" />
                              }
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={onGeocodeAddress ? "Geocode from address" : "Geocoding coming soon"}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={async () => {
                                if (onGeocodeAddress && (venue.address1 || venue.city)) {
                                  setLoadingGeo({ ...loadingGeo, [venue._id || venue.id]: 'geocode' });
                                  try {
                                    await onGeocodeAddress(venue);
                                  } finally {
                                    setLoadingGeo({ ...loadingGeo, [venue._id || venue.id]: null });
                                  }
                                }
                              }}
                              disabled={!onGeocodeAddress || (!venue.address1 && !venue.city) || loadingGeo[venue._id || venue.id] === 'geocode'}
                            >
                              {loadingGeo[venue._id || venue.id] === 'geocode' ? 
                                <CircularProgress size={18} /> : 
                                <MyLocationIcon fontSize="small" />
                              }
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit venue">
                          <IconButton 
                            size="small" 
                            onClick={() => onEdit && onEdit(venue)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {!venue.hasValidGeo && (
                          <Tooltip title="Validate geolocation">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => onValidateGeo && onValidateGeo(venue)}
                            >
                              <LocationOnIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete venue">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => onDelete && onDelete(venue)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={pagination.totalCount}
        rowsPerPage={pagination.pageSize}
        page={pagination.page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default VenueTable;