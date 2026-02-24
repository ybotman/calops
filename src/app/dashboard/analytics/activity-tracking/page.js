'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Collapse
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WifiIcon from '@mui/icons-material/Wifi';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MapIcon from '@mui/icons-material/Map';
import axios from 'axios';
import { useAppContext } from '@/lib/AppContext';
import { format } from 'date-fns';

// Helper to get location source display
const getSourceChip = (location) => {
  if (!location?.source) return null;

  const sourceConfig = {
    GoogleBrowser: { label: 'GPS', color: 'success', icon: <GpsFixedIcon sx={{ fontSize: 14 }} /> },
    GoogleGeolocation: { label: 'Google', color: 'primary', icon: <LocationOnIcon sx={{ fontSize: 14 }} /> },
    IPInfoIO: { label: 'IP', color: 'default', icon: <WifiIcon sx={{ fontSize: 14 }} /> }
  };

  const config = sourceConfig[location.source] || { label: location.source, color: 'default' };
  const accuracy = location.browserGps?.accuracy;
  const tooltipText = accuracy ? `${config.label} (±${Math.round(accuracy)}m)` : config.label;

  return (
    <Tooltip title={tooltipText} arrow>
      <Chip
        icon={config.icon}
        label={accuracy ? `±${Math.round(accuracy)}m` : config.label}
        size="small"
        color={config.color}
        sx={{ fontSize: '0.65rem', height: 20 }}
      />
    </Tooltip>
  );
};

/**
 * Activity Tracking Dashboard
 * Shows login history, visitor tracking, and map center history
 */
export default function ActivityTrackingPage() {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7D');

  // Data states
  const [loginHistory, setLoginHistory] = useState([]);
  const [visitorHistory, setVisitorHistory] = useState([]);
  const [mapCenterHistory, setMapCenterHistory] = useState([]);

  // Pagination states
  const [loginPagination, setLoginPagination] = useState({ page: 0, total: 0, pages: 0 });
  const [visitorPagination, setVisitorPagination] = useState({ page: 0, total: 0, pages: 0 });
  const [mapCenterPagination, setMapCenterPagination] = useState({ page: 0, total: 0, pages: 0 });
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [deviceType, setDeviceType] = useState('');
  const [geoSource, setGeoSource] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  // Build filter query string
  const buildFilterParams = useCallback(() => {
    const params = [];
    if (deviceType) params.push(`deviceType=${deviceType}`);
    if (geoSource) params.push(`geoSource=${geoSource}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (country) params.push(`country=${encodeURIComponent(country)}`);
    return params.length > 0 ? '&' + params.join('&') : '';
  }, [deviceType, geoSource, city, country]);

  const clearFilters = () => {
    setDeviceType('');
    setGeoSource('');
    setCity('');
    setCountry('');
  };

  const hasActiveFilters = deviceType || geoSource || city || country;

  // Fetch login history
  const fetchLoginHistory = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = buildFilterParams();
      const response = await axios.get(
        `/api/analytics/login-history?range=${timeRange}&page=${page}&limit=${rowsPerPage}${filterParams}&_t=${Date.now()}`
      );
      if (response.data?.success) {
        setLoginHistory(response.data.data || []);
        setLoginPagination(response.data.pagination || { page: 0, total: 0, pages: 0 });
      } else {
        throw new Error(response.data?.error || 'Failed to fetch login history');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Login history endpoint not available');
      } else {
        setError(err.message);
      }
      setLoginHistory([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, rowsPerPage, buildFilterParams]);

  // Fetch visitor history
  const fetchVisitorHistory = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = buildFilterParams();
      const response = await axios.get(
        `/api/analytics/visitor-history?range=${timeRange}&page=${page}&limit=${rowsPerPage}${filterParams}&_t=${Date.now()}`
      );
      if (response.data?.success) {
        setVisitorHistory(response.data.data || []);
        setVisitorPagination(response.data.pagination || { page: 0, total: 0, pages: 0 });
      } else {
        throw new Error(response.data?.error || 'Failed to fetch visitor history');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Visitor history endpoint not available');
      } else {
        setError(err.message);
      }
      setVisitorHistory([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, rowsPerPage, buildFilterParams]);

  // Fetch map center history
  const fetchMapCenterHistory = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = buildFilterParams();
      const response = await axios.get(
        `/api/analytics/map-center-history?range=${timeRange}&page=${page}&limit=${rowsPerPage}${filterParams}&_t=${Date.now()}`
      );
      if (response.data?.success) {
        setMapCenterHistory(response.data.data || []);
        setMapCenterPagination(response.data.pagination || { page: 0, total: 0, pages: 0 });
      } else {
        throw new Error(response.data?.error || 'Failed to fetch map center history');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Map center history endpoint not available');
      } else {
        setError(err.message);
      }
      setMapCenterHistory([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, rowsPerPage, buildFilterParams]);

  // Fetch data based on selected tab
  useEffect(() => {
    if (tabValue === 0) fetchLoginHistory(0);
    else if (tabValue === 1) fetchVisitorHistory(0);
    else if (tabValue === 2) fetchMapCenterHistory(0);
  }, [tabValue, timeRange, fetchLoginHistory, fetchVisitorHistory, fetchMapCenterHistory]);

  const handleRefresh = () => {
    if (tabValue === 0) fetchLoginHistory(loginPagination.page);
    else if (tabValue === 1) fetchVisitorHistory(visitorPagination.page);
    else if (tabValue === 2) fetchMapCenterHistory(mapCenterPagination.page);
  };

  const handleTimeRangeChange = (event, newValue) => {
    if (newValue) setTimeRange(newValue);
  };

  const handlePageChange = (event, newPage) => {
    if (tabValue === 0) {
      setLoginPagination(p => ({ ...p, page: newPage }));
      fetchLoginHistory(newPage);
    } else if (tabValue === 1) {
      setVisitorPagination(p => ({ ...p, page: newPage }));
      fetchVisitorHistory(newPage);
    } else if (tabValue === 2) {
      setMapCenterPagination(p => ({ ...p, page: newPage }));
      fetchMapCenterHistory(newPage);
    }
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const getCurrentPagination = () => {
    if (tabValue === 0) return loginPagination;
    if (tabValue === 1) return visitorPagination;
    return mapCenterPagination;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h4">Activity Tracking</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            <ToggleButton value="1H">1H</ToggleButton>
            <ToggleButton value="1D">1D</ToggleButton>
            <ToggleButton value="7D">7D</ToggleButton>
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="1Yr">1Yr</ToggleButton>
            <ToggleButton value="All">All</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant={hasActiveFilters ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color={hasActiveFilters ? 'secondary' : 'primary'}
          >
            Filters{hasActiveFilters ? ' (active)' : ''}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Filter Panel */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Device</InputLabel>
              <Select
                value={deviceType}
                label="Device"
                onChange={(e) => setDeviceType(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="mobile">Mobile</MenuItem>
                <MenuItem value="tablet">Tablet</MenuItem>
                <MenuItem value="desktop">Desktop</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Geo Source</InputLabel>
              <Select
                value={geoSource}
                label="Geo Source"
                onChange={(e) => setGeoSource(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="GoogleBrowser">GPS (Browser)</MenuItem>
                <MenuItem value="GoogleGeolocation">Google API</MenuItem>
                <MenuItem value="IPInfoIO">IP Lookup</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              sx={{ width: 140 }}
            />
            <TextField
              size="small"
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              sx={{ width: 100 }}
            />
            {hasActiveFilters && (
              <IconButton onClick={clearFilters} size="small" title="Clear filters">
                <ClearIcon />
              </IconButton>
            )}
          </Box>
        </Paper>
      </Collapse>

      {/* Info cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, borderTop: '4px solid #1976d2' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LoginIcon color="primary" />
              <Box>
                <Typography variant="h6">Login History</Typography>
                <Typography variant="caption" color="text.secondary">
                  UserLoginHistory collection
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              IP, device, browser, geolocation, timestamp
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, borderTop: '4px solid #2e7d32' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VisibilityIcon color="success" />
              <Box>
                <Typography variant="h6">Visitor Tracking</Typography>
                <Typography variant="caption" color="text.secondary">
                  VisitorTrackingHistory collection
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Anonymous visitors (1x/day per IP), page, device
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, borderTop: '4px solid #ed6c02' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MapIcon color="warning" />
              <Box>
                <Typography variant="h6">Map Center History</Typography>
                <Typography variant="caption" color="text.secondary">
                  MapCenterHistory collection
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              When users SET their map center location
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<LoginIcon />} label="Login History" iconPosition="start" />
          <Tab icon={<VisibilityIcon />} label="Visitor Tracking" iconPosition="start" />
          <Tab icon={<MapIcon />} label="Map Center" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Backend needs to implement GET endpoint for this data.
          </Typography>
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Login History Tab */}
      {!loading && tabValue === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {loginPagination.total.toLocaleString()} login records
            </Typography>
          </Box>
          {loginHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No login history data available for this time range.
            </Typography>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Timezone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loginHistory.map((entry, i) => (
                    <TableRow key={entry.id || i} hover>
                      <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {entry.firebaseUserId?.slice(-8) || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.deviceType || 'unknown'}
                          size="small"
                          color={entry.deviceType === 'mobile' ? 'primary' : entry.deviceType === 'tablet' ? 'secondary' : 'default'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {getSourceChip(entry.location)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Tooltip title={`${entry.location?.latitude?.toFixed(4) || '-'}, ${entry.location?.longitude?.toFixed(4) || '-'}`} arrow>
                          <span>
                            {[entry.location?.city || entry.location?.ipLookup?.city,
                              entry.location?.region || entry.location?.ipLookup?.region].filter(Boolean).join(', ') || '-'}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem' }}>
                        {entry.timezone || entry.location?.ipLookup?.timezone || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={loginPagination.total}
                page={loginPagination.page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </>
          )}
        </Paper>
      )}

      {/* Visitor Tracking Tab */}
      {!loading && tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {visitorPagination.total.toLocaleString()} visitor records
            </Typography>
          </Box>
          {visitorHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No visitor tracking data available for this time range.
            </Typography>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Visitor ID</TableCell>
                    <TableCell>Page</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Source</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visitorHistory.map((entry, i) => (
                    <TableRow key={entry.id || i} hover>
                      <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}>
                        {entry.visitorId?.slice(-8) || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {entry.page || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.deviceType || 'unknown'}
                          size="small"
                          color={entry.deviceType === 'mobile' ? 'primary' : entry.deviceType === 'tablet' ? 'secondary' : 'default'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Tooltip title={`${entry.location?.latitude?.toFixed(4) || '-'}, ${entry.location?.longitude?.toFixed(4) || '-'}`} arrow>
                          <span>
                            {[entry.location?.city || entry.location?.ipLookup?.city,
                              entry.location?.region || entry.location?.ipLookup?.region].filter(Boolean).join(', ') || '-'}
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={visitorPagination.total}
                page={visitorPagination.page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </>
          )}
        </Paper>
      )}

      {/* Map Center Tab */}
      {!loading && tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {mapCenterPagination.total.toLocaleString()} map center records
            </Typography>
          </Box>
          {mapCenterHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No map center history data available for this time range.
            </Typography>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Map Center</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>User Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mapCenterHistory.map((entry, i) => (
                    <TableRow key={entry.id || i} hover>
                      <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : '-'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {entry.firebaseUserId?.slice(-8) || '-'}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {entry.mapCenter?.latitude?.toFixed(4) || '-'}, {entry.mapCenter?.longitude?.toFixed(4) || '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.deviceType || 'unknown'}
                          size="small"
                          color={entry.deviceType === 'mobile' ? 'primary' : entry.deviceType === 'tablet' ? 'secondary' : 'default'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {[entry.userLocation?.city, entry.userLocation?.region, entry.userLocation?.country].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={mapCenterPagination.total}
                page={mapCenterPagination.page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleRowsPerPageChange}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
