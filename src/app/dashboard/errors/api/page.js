'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

// Time range options for error queries
const TIME_RANGES = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
];

// Status code chip with appropriate color
function StatusCodeChip({ code }) {
  const codeStr = String(code);
  let color = 'default';
  let icon = null;

  if (codeStr.startsWith('4')) {
    color = 'warning';
    icon = <WarningIcon fontSize="small" />;
  } else if (codeStr.startsWith('5')) {
    color = 'error';
    icon = <ErrorIcon fontSize="small" />;
  }

  return (
    <Chip
      label={code}
      size="small"
      color={color}
      icon={icon}
      sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
    />
  );
}

export default function ApiErrorsPage() {
  const [errorTimeRange, setErrorTimeRange] = useState('24h');
  const [environment, setEnvironment] = useState('prod');
  const [errorSummary, setErrorSummary] = useState({ rows: [], loading: true, error: null });
  const [errorsByEndpoint, setErrorsByEndpoint] = useState({ rows: [], loading: true, error: null });
  const [recentErrors, setRecentErrors] = useState({ rows: [], loading: true, error: null });

  // Fetch App Insights error data
  const fetchErrorData = useCallback(async (timeRange, env) => {
    // Fetch error summary
    setErrorSummary(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/appinsights?query=errorSummary&timeRange=${timeRange}&env=${env}`);
      const data = await res.json();
      if (data.success) {
        setErrorSummary({ rows: data.rows || [], loading: false, error: null });
      } else {
        setErrorSummary({ rows: [], loading: false, error: data.error || 'Failed to fetch' });
      }
    } catch (e) {
      setErrorSummary({ rows: [], loading: false, error: e.message });
    }

    // Fetch errors by endpoint
    setErrorsByEndpoint(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/appinsights?query=errorsByEndpoint&timeRange=${timeRange}&env=${env}`);
      const data = await res.json();
      if (data.success) {
        setErrorsByEndpoint({ rows: data.rows || [], loading: false, error: null });
      } else {
        setErrorsByEndpoint({ rows: [], loading: false, error: data.error || 'Failed to fetch' });
      }
    } catch (e) {
      setErrorsByEndpoint({ rows: [], loading: false, error: e.message });
    }

    // Fetch recent errors
    setRecentErrors(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/appinsights?query=recentErrors&timeRange=${timeRange}&env=${env}`);
      const data = await res.json();
      if (data.success) {
        setRecentErrors({ rows: data.rows || [], loading: false, error: null });
      } else {
        setRecentErrors({ rows: [], loading: false, error: data.error || 'Failed to fetch' });
      }
    } catch (e) {
      setRecentErrors({ rows: [], loading: false, error: e.message });
    }
  }, []);

  useEffect(() => {
    fetchErrorData(errorTimeRange, environment);
  }, [errorTimeRange, environment, fetchErrorData]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Extract endpoint name from full path
  const getEndpointName = (name) => {
    if (!name) return '-';
    return name.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/, '');
  };

  // Copy all error data to clipboard
  const copyErrorsToClipboard = () => {
    const lines = [];
    lines.push(`API Errors Report - ${errorTimeRange} time range`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');

    // Summary
    lines.push('=== ERROR SUMMARY ===');
    if (errorSummary.rows.length === 0) {
      lines.push('No errors');
    } else {
      errorSummary.rows.forEach(row => {
        lines.push(`${row.resultCode}: ${row.count_}`);
      });
    }
    lines.push('');

    // Top endpoints
    lines.push('=== TOP FAILING ENDPOINTS ===');
    if (errorsByEndpoint.rows.length === 0) {
      lines.push('No errors');
    } else {
      errorsByEndpoint.rows.slice(0, 20).forEach(row => {
        lines.push(`${getEndpointName(row.name)} [${row.resultCode}]: ${row.count_}`);
      });
    }
    lines.push('');

    // Recent errors
    lines.push('=== RECENT ERRORS ===');
    if (recentErrors.rows.length === 0) {
      lines.push('No recent errors');
    } else {
      recentErrors.rows.forEach(row => {
        const ts = formatTimestamp(row.timestamp);
        const endpoint = getEndpointName(row.name);
        const location = row.client_City && row.client_CountryOrRegion
          ? `${row.client_City}, ${row.client_CountryOrRegion}`
          : row.client_CountryOrRegion || '-';
        const duration = row.duration ? `${Math.round(row.duration)}ms` : '-';
        lines.push(`${ts} | ${endpoint} | ${row.resultCode} | ${duration} | ${location} | ${row.operation_Id || '-'}`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">API Errors</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={environment}
            exclusive
            onChange={(e, newEnv) => newEnv && setEnvironment(newEnv)}
            size="small"
          >
            <ToggleButton value="prod" sx={{ px: 2 }}>
              PROD
            </ToggleButton>
            <ToggleButton value="test" sx={{ px: 2 }}>
              TEST
            </ToggleButton>
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={errorTimeRange}
              label="Time Range"
              onChange={(e) => setErrorTimeRange(e.target.value)}
            >
              {TIME_RANGES.map(({ value, label }) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={copyErrorsToClipboard}
            disabled={errorSummary.loading || recentErrors.loading}
          >
            Copy All
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => fetchErrorData(errorTimeRange, environment)}
            disabled={errorSummary.loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<TrendingUpIcon />}
            href="/dashboard/errors/trends"
            color="primary"
          >
            Trends
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Azure Functions API errors from App Insights ({environment.toUpperCase()})
      </Typography>

      <Grid container spacing={3}>
        {/* Error Summary Card */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Error Summary
              </Typography>
              {errorSummary.loading && <CircularProgress size={24} />}
              {errorSummary.error && (
                <Alert severity="error" sx={{ mb: 1 }}>{errorSummary.error}</Alert>
              )}
              {!errorSummary.loading && !errorSummary.error && (
                <>
                  {errorSummary.rows.length === 0 ? (
                    <Alert severity="success">No errors in this time range</Alert>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {errorSummary.rows.map((row, i) => (
                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <StatusCodeChip code={row.resultCode} />
                          <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                            {row.count_}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Errors by Endpoint Card */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Top Failing Endpoints
              </Typography>
              {errorsByEndpoint.loading && <CircularProgress size={24} />}
              {errorsByEndpoint.error && (
                <Alert severity="error" sx={{ mb: 1 }}>{errorsByEndpoint.error}</Alert>
              )}
              {!errorsByEndpoint.loading && !errorsByEndpoint.error && (
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {errorsByEndpoint.rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center">
                            No errors
                          </TableCell>
                        </TableRow>
                      ) : (
                        errorsByEndpoint.rows.slice(0, 15).map((row, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {getEndpointName(row.name)}
                            </TableCell>
                            <TableCell>
                              <StatusCodeChip code={row.resultCode} />
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                {row.count_}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Errors Table */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Recent Errors
              </Typography>
              {recentErrors.loading && <CircularProgress size={24} />}
              {recentErrors.error && (
                <Alert severity="error" sx={{ mb: 1 }}>{recentErrors.error}</Alert>
              )}
              {!recentErrors.loading && !recentErrors.error && (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Endpoint</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Operation ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentErrors.rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No recent errors
                          </TableCell>
                        </TableRow>
                      ) : (
                        recentErrors.rows.map((row, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                              {formatTimestamp(row.timestamp)}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 250 }}>
                              <Tooltip title={row.url || ''}>
                                <span>{getEndpointName(row.name)}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <StatusCodeChip code={row.resultCode} />
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {row.duration ? `${Math.round(row.duration)}ms` : '-'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8rem' }}>
                              {row.client_City && row.client_CountryOrRegion
                                ? `${row.client_City}, ${row.client_CountryOrRegion}`
                                : row.client_CountryOrRegion || '-'}
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                              <Tooltip title="Copy Operation ID">
                                <span
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => navigator.clipboard.writeText(row.operation_Id)}
                                >
                                  {row.operation_Id?.substring(0, 8)}...
                                </span>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
