'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import BugReportIcon from '@mui/icons-material/BugReport';

// Time range options for error queries
const TIME_RANGES = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
];

export default function ErrorTrendsPage() {
  const [errorTimeRange, setErrorTimeRange] = useState('24h');
  const [environment, setEnvironment] = useState('prod');
  const [errorsByEndpoint, setErrorsByEndpoint] = useState({ rows: [], loading: true, error: null });
  const [errorTimeline, setErrorTimeline] = useState({ rows: [], loading: true, error: null });
  const [selectedEndpoints, setSelectedEndpoints] = useState([]);
  const [availableEndpoints, setAvailableEndpoints] = useState([]);

  // Fetch App Insights error data
  const fetchErrorData = useCallback(async (timeRange, env) => {
    // Fetch errors by endpoint (for filter options)
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

    // Fetch error timeline by endpoint
    setErrorTimeline(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/appinsights?query=errorTimelineByEndpoint&timeRange=${timeRange}&env=${env}`);
      const data = await res.json();
      if (data.success) {
        setErrorTimeline({ rows: data.rows || [], loading: false, error: null });
      } else {
        setErrorTimeline({ rows: [], loading: false, error: data.error || 'Failed to fetch' });
      }
    } catch (e) {
      setErrorTimeline({ rows: [], loading: false, error: e.message });
    }
  }, []);

  useEffect(() => {
    fetchErrorData(errorTimeRange, environment);
  }, [errorTimeRange, environment, fetchErrorData]);

  // Update available endpoints when data changes
  useEffect(() => {
    if (errorsByEndpoint.rows.length > 0) {
      const endpoints = [...new Set(errorsByEndpoint.rows.map(r => r.name))].filter(Boolean);
      setAvailableEndpoints(endpoints);
      // Auto-select top 5 endpoints if none selected
      if (selectedEndpoints.length === 0 && endpoints.length > 0) {
        setSelectedEndpoints(endpoints.slice(0, 5));
      }
    }
  }, [errorsByEndpoint.rows]);

  // Extract endpoint name from full path
  const getEndpointName = (name) => {
    if (!name) return '-';
    return name.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/, '');
  };

  // Process timeline data for chart
  const getChartData = useCallback(() => {
    if (errorTimeline.rows.length === 0) return [];

    // Filter by selected endpoints
    const filtered = selectedEndpoints.length > 0
      ? errorTimeline.rows.filter(r => selectedEndpoints.includes(r.name))
      : errorTimeline.rows;

    // Group by timestamp
    const timeMap = {};
    filtered.forEach(row => {
      const ts = new Date(row.timestamp).getTime();
      if (!timeMap[ts]) {
        timeMap[ts] = { timestamp: ts };
      }
      const endpointKey = row.name?.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/, '') || 'Unknown';
      timeMap[ts][endpointKey] = (timeMap[ts][endpointKey] || 0) + row.count_;
    });

    return Object.values(timeMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [errorTimeline.rows, selectedEndpoints]);

  // Get unique endpoint names for chart lines
  const getChartEndpoints = useCallback(() => {
    if (selectedEndpoints.length === 0) return [];
    return selectedEndpoints.map(e => e?.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/, '') || 'Unknown');
  }, [selectedEndpoints]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Error Trends</Typography>
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

          {/* Endpoint Multi-Select */}
          <FormControl size="small" sx={{ minWidth: 300 }}>
            <InputLabel>Filter Endpoints</InputLabel>
            <Select
              multiple
              value={selectedEndpoints}
              onChange={(e) => setSelectedEndpoints(e.target.value)}
              input={<OutlinedInput label="Filter Endpoints" />}
              renderValue={(selected) => `${selected.length} endpoint${selected.length !== 1 ? 's' : ''} selected`}
            >
              {availableEndpoints.map((endpoint) => (
                <MenuItem key={endpoint} value={endpoint}>
                  <Checkbox checked={selectedEndpoints.indexOf(endpoint) > -1} />
                  <ListItemText primary={getEndpointName(endpoint)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Time Range */}
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
            startIcon={<RefreshIcon />}
            onClick={() => fetchErrorData(errorTimeRange, environment)}
            disabled={errorTimeline.loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<BugReportIcon />}
            href="/dashboard/errors/api"
            color="primary"
          >
            API
          </Button>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Error trends over time from Azure Functions App Insights ({environment.toUpperCase()})
      </Typography>

      {/* Chart */}
      <Card variant="outlined">
        <CardContent>
          {errorTimeline.loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {errorTimeline.error && (
            <Alert severity="error" sx={{ mb: 2 }}>{errorTimeline.error}</Alert>
          )}
          {!errorTimeline.loading && !errorTimeline.error && (
            <>
              {getChartData().length === 0 ? (
                <Alert severity="info">No error data for selected endpoints in this time range</Alert>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) => new Date(ts).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric'
                      })}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <RechartsTooltip
                      labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      contentStyle={{ fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    {getChartEndpoints().map((endpoint, index) => (
                      <Line
                        key={endpoint}
                        type="monotone"
                        dataKey={endpoint}
                        stroke={`hsl(${(index * 50) % 360}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </>
          )}

          {/* Selected endpoints summary */}
          {selectedEndpoints.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedEndpoints.map((ep, i) => (
                <Chip
                  key={ep}
                  label={getEndpointName(ep)}
                  size="small"
                  onDelete={() => setSelectedEndpoints(prev => prev.filter(e => e !== ep))}
                  sx={{
                    backgroundColor: `hsl(${(i * 50) % 360}, 70%, 90%)`,
                    '& .MuiChip-deleteIcon': { color: `hsl(${(i * 50) % 360}, 70%, 40%)` }
                  }}
                />
              ))}
              {selectedEndpoints.length > 1 && (
                <Button size="small" onClick={() => setSelectedEndpoints([])}>
                  Clear All
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
