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
  Tab
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LoginIcon from '@mui/icons-material/Login';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MapIcon from '@mui/icons-material/Map';
import axios from 'axios';
import { useAppContext } from '@/lib/AppContext';
import { format } from 'date-fns';

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
  const [loginHistory, setLoginHistory] = useState([]);
  const [visitorHistory, setVisitorHistory] = useState([]);
  const [mapCenterHistory, setMapCenterHistory] = useState([]);

  // Fetch login history
  const fetchLoginHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/analytics/login-history?appId=${appId}&limit=100`);
      setLoginHistory(response.data?.history || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Login history endpoint not implemented yet (GET /api/analytics/login-history)');
      } else {
        setError(err.message);
      }
      setLoginHistory([]);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  // Fetch visitor history
  const fetchVisitorHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/analytics/visitor-history?appId=${appId}&limit=100`);
      setVisitorHistory(response.data?.history || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Visitor history endpoint not implemented yet (GET /api/analytics/visitor-history)');
      } else {
        setError(err.message);
      }
      setVisitorHistory([]);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  // Fetch map center history
  const fetchMapCenterHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/analytics/mapcenter-history?appId=${appId}&limit=100`);
      setMapCenterHistory(response.data?.history || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Map center history endpoint not implemented yet (GET /api/analytics/mapcenter-history)');
      } else {
        setError(err.message);
      }
      setMapCenterHistory([]);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  // Fetch data based on selected tab
  useEffect(() => {
    if (tabValue === 0) fetchLoginHistory();
    else if (tabValue === 1) fetchVisitorHistory();
    else if (tabValue === 2) fetchMapCenterHistory();
  }, [tabValue, fetchLoginHistory, fetchVisitorHistory, fetchMapCenterHistory]);

  const handleRefresh = () => {
    if (tabValue === 0) fetchLoginHistory();
    else if (tabValue === 1) fetchVisitorHistory();
    else if (tabValue === 2) fetchMapCenterHistory();
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Activity Tracking</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

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
          {loginHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No login history data available yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Browser</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loginHistory.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>
                      {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : '-'}
                    </TableCell>
                    <TableCell>{entry.userName || entry.email || entry.userId?.slice(-8) || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{entry.ip || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{entry.device || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{entry.browser || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{entry.city || entry.country || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* Visitor Tracking Tab */}
      {!loading && tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          {visitorHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No visitor tracking data available yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>IP</TableCell>
                  <TableCell>Page</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Country</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visitorHistory.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>
                      {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : '-'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{entry.ip || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{entry.page || entry.path || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{entry.device || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{entry.country || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* Map Center Tab */}
      {!loading && tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          {mapCenterHistory.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>
              No map center history data available yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Latitude</TableCell>
                  <TableCell>Longitude</TableCell>
                  <TableCell>City</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mapCenterHistory.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>
                      {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d, h:mm a') : '-'}
                    </TableCell>
                    <TableCell>{entry.userName || entry.userId?.slice(-8) || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{entry.latitude?.toFixed(4) || '-'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{entry.longitude?.toFixed(4) || '-'}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{entry.city || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Box>
  );
}
