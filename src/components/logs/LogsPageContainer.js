'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Backdrop
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import { useAppContext } from '@/lib/AppContext';
import apiClient from '@/lib/api-client';
import LogTable from './components/LogTable';
import LogMobileCards from './components/LogMobileCards';
import ResponsiveTableWrapper from '@/components/common/ResponsiveTableWrapper';
import LogQuickFilters from './components/LogQuickFilters';
import LogDetailsDialog from './components/LogDetailsDialog';
import LogAdvancedFilters from './components/LogAdvancedFilters';
import { DEFAULT_PAGE_SIZE, LOG_LEVELS } from './utils/logConstants';
import { getQuickFilterDates } from './utils/logFormatters';

/**
 * LogsPageContainer
 * Main container for the logs viewer page
 */
const LogsPageContainer = () => {
  const { currentApp } = useAppContext();
  
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    selectedTimeFilter: '24h',
    showErrorsOnly: false,
    levels: [],
    actions: [],
    resources: [],
    statuses: [],
    searchText: '',
    startDate: null,
    endDate: null,
    userEmail: '',
    userId: '',
    orgId: '',
    httpStatus: '',
    minDuration: '',
    maxDuration: '',
    endpoint: '',
    ipAddress: ''
  });
  
  // UI State
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [exportLoading, setExportLoading] = useState(false);
  
  // Auto refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const refreshTimerRef = useRef(null);

  // Fetch logs
  const fetchLogs = useCallback(async (pageOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build filter parameters
      const filterParams = {
        appId: currentApp?.id || currentApp,
        page: pageOptions.page ?? pagination.page,
        pageSize: pageOptions.pageSize ?? pagination.pageSize
      };
      
      // Add date range
      if (filters.selectedTimeFilter && filters.selectedTimeFilter !== 'custom') {
        const { start, end } = getQuickFilterDates(filters.selectedTimeFilter);
        if (start) filterParams.startDate = start;
        if (end) filterParams.endDate = end;
      } else if (filters.startDate || filters.endDate) {
        if (filters.startDate) filterParams.startDate = filters.startDate;
        if (filters.endDate) filterParams.endDate = filters.endDate;
      }
      
      // Add level filter
      if (filters.showErrorsOnly) {
        filterParams.levels = [LOG_LEVELS.ERROR];
      } else if (filters.levels.length > 0) {
        filterParams.levels = filters.levels;
      }
      
      // Add other filters
      if (filters.actions.length > 0) filterParams.actions = filters.actions;
      if (filters.resources.length > 0) filterParams.resources = filters.resources;
      if (filters.statuses && filters.statuses.length > 0) filterParams.statuses = filters.statuses;
      if (filters.searchText) filterParams.searchText = filters.searchText;
      if (filters.userEmail) filterParams.userEmail = filters.userEmail;
      if (filters.userId) filterParams.userId = filters.userId;
      if (filters.orgId) filterParams.orgId = filters.orgId;
      if (filters.httpStatus) filterParams.httpStatus = filters.httpStatus;
      if (filters.minDuration) filterParams.minDuration = filters.minDuration;
      if (filters.maxDuration) filterParams.maxDuration = filters.maxDuration;
      if (filters.endpoint) filterParams.endpoint = filters.endpoint;
      if (filters.ipAddress) filterParams.ipAddress = filters.ipAddress;
      
      // Fetch logs
      const response = await apiClient.logs.getLogs(filterParams);
      
      console.log('LogsPageContainer received response:', response);
      
      // Extract logs array from response
      const logsArray = response.logs || [];
      console.log('LogsPageContainer extracted logs:', logsArray);
      
      setLogs(logsArray);
      setPagination({
        page: pageOptions.page ?? pagination.page,
        pageSize: pageOptions.pageSize ?? pagination.pageSize,
        totalCount: response.pagination?.total || logsArray.length || 0
      });
    } catch (err) {
      console.error('Error fetching logs:', err);
      
      let errorMessage = 'Failed to fetch logs';
      if (err.response) {
        if (err.response.status === 404) {
          errorMessage = 'Logs API endpoint not found. The backend may not have implemented the logs feature yet.';
        } else if (err.response.status === 500) {
          errorMessage = 'Backend server error when fetching logs. The logs collection may not be set up yet.';
          // Check for specific error messages from backend
          if (err.response.data?.message) {
            errorMessage += ` Details: ${err.response.data.message}`;
          }
        } else if (err.response.status === 401 || err.response.status === 403) {
          errorMessage = 'Authentication error. You may not have permission to view logs.';
        }
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to backend server. Make sure the backend is running at ' + (process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010');
      }
      
      setError(errorMessage);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentApp, filters, pagination.page, pagination.pageSize]);

  // Initial load and filter changes
  useEffect(() => {
    fetchLogs({ page: 0 });
  }, [currentApp, filters]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        fetchLogs();
      }, refreshInterval);
      
      return () => {
        if (refreshTimerRef.current) {
          clearInterval(refreshTimerRef.current);
        }
      };
    } else {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    }
  }, [autoRefresh, refreshInterval, fetchLogs]);

  // Handlers
  const handlePaginationChange = ({ page, pageSize }) => {
    fetchLogs({ page, pageSize });
  };

  const handleTimeFilterChange = (value) => {
    setFilters(prev => ({ ...prev, selectedTimeFilter: value }));
  };

  const handleErrorsOnlyChange = (value) => {
    setFilters(prev => ({ ...prev, showErrorsOnly: value }));
  };

  const handleAdvancedFiltersChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setTimeout(() => setSelectedLog(null), 300);
  };

  const handleRefresh = () => {
    fetchLogs();
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await apiClient.logs.exportLogs({
        ...filters,
        appId: currentApp?.id || currentApp
      }, 'csv');
      
      setSnackbar({
        open: true,
        message: 'Logs exported successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Export failed:', err);
      setSnackbar({
        open: true,
        message: 'Failed to export logs',
        severity: 'error'
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          System Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and analyze system logs, API operations, and user activities
        </Typography>
      </Box>

      {/* Quick Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <LogQuickFilters
          selectedTimeFilter={filters.selectedTimeFilter}
          onTimeFilterChange={handleTimeFilterChange}
          showErrorsOnly={filters.showErrorsOnly}
          onErrorsOnlyChange={handleErrorsOnlyChange}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          refreshInterval={refreshInterval}
          onRefreshIntervalChange={setRefreshInterval}
        />
      </Paper>

      {/* Advanced Filters */}
      <LogAdvancedFilters
        open={showAdvancedFilters}
        filters={filters}
        onFiltersChange={handleAdvancedFiltersChange}
        onClose={() => setShowAdvancedFilters(false)}
        appId={currentApp?.id || currentApp}
      />

      {/* Actions Bar */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        mb={2} 
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
      >
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            size="small"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            size="small"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Filters
          </Button>
        </Stack>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={loading || logs.length === 0}
          size="small"
          fullWidth={{ xs: true, sm: false }}
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Export CSV
        </Button>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            {error}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            The logs API endpoint may not be implemented yet in the backend. 
            Check if the backend server at {process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010'} has the /api/logs endpoint ready.
          </Typography>
        </Alert>
      )}

      {/* Logs Table */}
      <Paper sx={{ height: { xs: 'auto', sm: 600 }, width: '100%' }}>
        <ResponsiveTableWrapper
          desktopView={
            <LogTable
              logs={logs || []}
              loading={loading}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              onRowClick={handleRowClick}
              error={error}
            />
          }
          mobileView={
            <LogMobileCards
              logs={logs || []}
              loading={loading}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              onRowClick={handleRowClick}
              error={error}
            />
          }
        />
      </Paper>

      {/* Details Dialog */}
      <LogDetailsDialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        log={selectedLog}
      />

      {/* Export Loading */}
      <Backdrop open={exportLoading} sx={{ zIndex: 9999 }}>
        <CircularProgress color="primary" />
      </Backdrop>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default LogsPageContainer;