'use client';

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Grid,
  TextField,
  Autocomplete,
  Button,
  Typography,
  Chip,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import dayjs from 'dayjs';
import apiClient from '@/lib/api-client';
import { 
  LOG_LEVELS, 
  LOG_ACTIONS, 
  LOG_RESOURCES,
  LOG_STATUS 
} from '../utils/logConstants';

/**
 * LogAdvancedFilters component
 * Provides advanced filtering options for logs
 */
const LogAdvancedFilters = ({
  open,
  filters,
  onFiltersChange,
  onClose,
  appId
}) => {
  const [localFilters, setLocalFilters] = useState({
    levels: [],
    actions: [],
    resources: [],
    statuses: [],
    userEmail: '',
    userId: '',
    orgId: '',
    httpStatus: '',
    minDuration: '',
    maxDuration: '',
    searchText: '',
    startDate: null,
    endDate: null,
    endpoint: '',
    ipAddress: '',
    ...filters
  });

  const [filterOptions, setFilterOptions] = useState({
    userEmails: [],
    userIds: [],
    orgIds: [],
    endpoints: [],
    ipAddresses: []
  });

  // Load filter options from API
  useEffect(() => {
    if (open && appId) {
      loadFilterOptions();
    }
  }, [open, appId]);

  const loadFilterOptions = async () => {
    try {
      const response = await apiClient.logs.getFilterOptions(appId);
      setFilterOptions({
        userEmails: response.userEmails || [],
        userIds: response.userIds || [],
        orgIds: response.orgIds || [],
        endpoints: response.endpoints || [],
        ipAddresses: response.ipAddresses || []
      });
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Update local filters when parent filters change
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      ...filters
    }));
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApplyFilters = () => {
    // Clean up empty values
    const cleanedFilters = Object.entries(localFilters).reduce((acc, [key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onFiltersChange(cleanedFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      levels: [],
      actions: [],
      resources: [],
      statuses: [],
      userEmail: '',
      userId: '',
      orgId: '',
      httpStatus: '',
      minDuration: '',
      maxDuration: '',
      searchText: '',
      startDate: null,
      endDate: null,
      endpoint: '',
      ipAddress: '',
      selectedTimeFilter: '24h',
      showErrorsOnly: false
    };
    setLocalFilters(resetFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.levels.length > 0) count++;
    if (localFilters.actions.length > 0) count++;
    if (localFilters.resources.length > 0) count++;
    if (localFilters.statuses.length > 0) count++;
    if (localFilters.userEmail) count++;
    if (localFilters.userId) count++;
    if (localFilters.orgId) count++;
    if (localFilters.httpStatus) count++;
    if (localFilters.minDuration) count++;
    if (localFilters.maxDuration) count++;
    if (localFilters.searchText) count++;
    if (localFilters.startDate) count++;
    if (localFilters.endDate) count++;
    if (localFilters.endpoint) count++;
    if (localFilters.ipAddress) count++;
    return count;
  };

  return (
    <Collapse in={open}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <FilterListIcon color="primary" />
            <Typography variant="h6">Advanced Filters</Typography>
            {getActiveFilterCount() > 0 && (
              <Chip 
                label={`${getActiveFilterCount()} active`} 
                color="primary" 
                size="small" 
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3}>
            {/* Date Range */}
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="Start Date"
                value={localFilters.startDate ? dayjs(localFilters.startDate) : null}
                onChange={(value) => handleFilterChange('startDate', value?.toISOString())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DateTimePicker
                label="End Date"
                value={localFilters.endDate ? dayjs(localFilters.endDate) : null}
                onChange={(value) => handleFilterChange('endDate', value?.toISOString())}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>

            {/* Log Properties */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={Object.values(LOG_LEVELS)}
                value={localFilters.levels}
                onChange={(_, value) => handleFilterChange('levels', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Log Levels" size="small" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      variant="outlined"
                      label={option.toUpperCase()}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={Object.values(LOG_ACTIONS)}
                value={localFilters.actions}
                onChange={(_, value) => handleFilterChange('actions', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Actions" size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={Object.values(LOG_RESOURCES)}
                value={localFilters.resources}
                onChange={(_, value) => handleFilterChange('resources', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Resources" size="small" />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={Object.values(LOG_STATUS)}
                value={localFilters.statuses}
                onChange={(_, value) => handleFilterChange('statuses', value)}
                renderInput={(params) => (
                  <TextField {...params} label="Status" size="small" />
                )}
              />
            </Grid>

            {/* User and Organization */}
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={filterOptions.userEmails}
                value={localFilters.userEmail}
                onChange={(_, value) => handleFilterChange('userEmail', value || '')}
                renderInput={(params) => (
                  <TextField {...params} label="User Email" size="small" />
                )}
                freeSolo
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={filterOptions.userIds}
                value={localFilters.userId}
                onChange={(_, value) => handleFilterChange('userId', value || '')}
                renderInput={(params) => (
                  <TextField {...params} label="User ID" size="small" />
                )}
                freeSolo
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={filterOptions.orgIds}
                value={localFilters.orgId}
                onChange={(_, value) => handleFilterChange('orgId', value || '')}
                renderInput={(params) => (
                  <TextField {...params} label="Organization ID" size="small" />
                )}
                freeSolo
              />
            </Grid>

            {/* Technical Filters */}
            <Grid item xs={12} md={4}>
              <TextField
                label="HTTP Status"
                value={localFilters.httpStatus}
                onChange={(e) => handleFilterChange('httpStatus', e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., 200, 404, 500"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Min Duration (ms)"
                value={localFilters.minDuration}
                onChange={(e) => handleFilterChange('minDuration', e.target.value)}
                size="small"
                fullWidth
                type="number"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Max Duration (ms)"
                value={localFilters.maxDuration}
                onChange={(e) => handleFilterChange('maxDuration', e.target.value)}
                size="small"
                fullWidth
                type="number"
              />
            </Grid>

            {/* Additional Filters */}
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={filterOptions.endpoints}
                value={localFilters.endpoint}
                onChange={(_, value) => handleFilterChange('endpoint', value || '')}
                renderInput={(params) => (
                  <TextField {...params} label="API Endpoint" size="small" />
                )}
                freeSolo
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={filterOptions.ipAddresses}
                value={localFilters.ipAddress}
                onChange={(_, value) => handleFilterChange('ipAddress', value || '')}
                renderInput={(params) => (
                  <TextField {...params} label="IP Address" size="small" />
                )}
                freeSolo
              />
            </Grid>

            {/* Search Text */}
            <Grid item xs={12}>
              <TextField
                label="Search in logs"
                value={localFilters.searchText}
                onChange={(e) => handleFilterChange('searchText', e.target.value)}
                size="small"
                fullWidth
                placeholder="Search in message, error, details..."
              />
            </Grid>
          </Grid>
        </LocalizationProvider>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleResetFilters}
          >
            Reset All
          </Button>
          <Button
            variant="contained"
            startIcon={<FilterListIcon />}
            onClick={handleApplyFilters}
          >
            Apply Filters ({getActiveFilterCount()})
          </Button>
        </Stack>
      </Paper>
    </Collapse>
  );
};

LogAdvancedFilters.propTypes = {
  open: PropTypes.bool.isRequired,
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  appId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default LogAdvancedFilters;