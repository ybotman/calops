'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { QUICK_FILTERS, LOG_LEVELS } from '../utils/logConstants';

/**
 * LogQuickFilters component
 * Provides quick filter options for common log queries
 */
const LogQuickFilters = ({
  selectedTimeFilter,
  onTimeFilterChange,
  showErrorsOnly,
  onErrorsOnlyChange,
  autoRefresh,
  onAutoRefreshChange,
  refreshInterval,
  onRefreshIntervalChange
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack spacing={2}>
        {/* Time Range Quick Filters */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
            Quick Time Filters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {QUICK_FILTERS.filter(f => f.value !== 'errors' && f.value !== 'all').map((filter) => (
              <Chip
                key={filter.value}
                label={filter.label}
                icon={<AccessTimeIcon />}
                onClick={() => onTimeFilterChange(filter.value)}
                color={selectedTimeFilter === filter.value ? 'primary' : 'default'}
                variant={selectedTimeFilter === filter.value ? 'filled' : 'outlined'}
                clickable
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              />
            ))}
            <Chip
              label="Custom Range"
              onClick={() => onTimeFilterChange('custom')}
              color={selectedTimeFilter === 'custom' ? 'primary' : 'default'}
              variant={selectedTimeFilter === 'custom' ? 'filled' : 'outlined'}
              clickable
              size="small"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            />
          </Box>
        </Box>

        {/* Level and Status Filters */}
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={showErrorsOnly}
                onChange={(e) => onErrorsOnlyChange(e.target.checked)}
                color="error"
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <ErrorOutlineIcon color="error" fontSize="small" />
                <Typography variant="body2">Errors Only</Typography>
              </Stack>
            }
          />

          {/* Auto Refresh Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshChange(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <RefreshIcon color={autoRefresh ? 'primary' : 'inherit'} fontSize="small" />
                <Typography variant="body2">Auto Refresh</Typography>
              </Stack>
            }
          />

          {/* Refresh Interval Selection */}
          {autoRefresh && (
            <ToggleButtonGroup
              value={refreshInterval}
              exclusive
              onChange={(e, value) => value && onRefreshIntervalChange(value)}
              size="small"
            >
              <ToggleButton value={30000}>30s</ToggleButton>
              <ToggleButton value={60000}>1m</ToggleButton>
              <ToggleButton value={300000}>5m</ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

LogQuickFilters.propTypes = {
  selectedTimeFilter: PropTypes.string,
  onTimeFilterChange: PropTypes.func.isRequired,
  showErrorsOnly: PropTypes.bool,
  onErrorsOnlyChange: PropTypes.func.isRequired,
  autoRefresh: PropTypes.bool,
  onAutoRefreshChange: PropTypes.func.isRequired,
  refreshInterval: PropTypes.number,
  onRefreshIntervalChange: PropTypes.func.isRequired
};

export default LogQuickFilters;