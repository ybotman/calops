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
 * @returns {JSX.Element} VenueTable component
 */
const VenueTable = ({
  venues = [],
  loading = false,
  pagination = { page: 0, pageSize: 10, totalCount: 0 },
  onPaginationChange,
  onEdit,
  onDelete,
  onValidateGeo
}) => {
  // Local state for row actions
  const [hoveredRow, setHoveredRow] = useState(null);
  
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
    { id: 'name', label: 'Name', minWidth: 180 },
    { id: 'location', label: 'Address', minWidth: 200 },
    { id: 'city', label: 'City', minWidth: 120 },
    { id: 'state', label: 'State', minWidth: 80 },
    { id: 'zip', label: 'Zip', minWidth: 80 },
    { id: 'region', label: 'Region', minWidth: 120 },
    { id: 'geoStatus', label: 'Geo Status', minWidth: 100 },
    { id: 'geoUpdated', label: 'Geo Updated', minWidth: 120 },
    { id: 'actions', label: 'Actions', minWidth: 120, align: 'right' }
  ];
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="venues table">
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
                      <Typography variant="body2" noWrap>
                        {venue.name || venue.displayName || 'Unnamed Venue'}
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
                        {venue.cityName || venue.masteredCityName || venue.city || venue.address?.city || 'Unknown'}
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
                      <Typography variant="body2" noWrap>
                        {venue.regionName || venue.masteredRegionName || 'Unknown'}
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
                      <Typography variant="body2" noWrap>
                        {venue.lastGeoUpdate ? 
                          new Date(venue.lastGeoUpdate).toLocaleDateString() : 
                          venue.updatedAt ? 
                            new Date(venue.updatedAt).toLocaleDateString() : 
                            'Never'}
                      </Typography>
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