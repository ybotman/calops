'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import RefreshIcon from '@mui/icons-material/Refresh';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WifiIcon from '@mui/icons-material/Wifi';
import axios from 'axios';
import { format, subDays, isValid } from 'date-fns';
import { useAppContext } from '@/lib/AppContext';

// SSR-disabled map (Leaflet refuses to render on the server)
const ActivityMapView = dynamic(() => import('./ActivityMapView'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ),
});

const DEFAULT_LIMIT = 200; // BE caps at 200 per call

export default function ActivityMapPage() {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [geoSource, setGeoSource] = useState('');
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async () => {
    if (!isValid(startDate) || !isValid(endDate)) {
      setError('Pick valid Start and Finish dates.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('startDate', startDate.toISOString());
      params.set('endDate', endDate.toISOString());
      params.set('limit', String(DEFAULT_LIMIT));
      params.set('page', '0');
      params.set('appId', String(appId));
      if (geoSource) params.set('geoSource', geoSource);

      const res = await axios.get(`/api/analytics/map-center-history?${params.toString()}&_t=${Date.now()}`);
      if (res.data?.success) {
        setRecords(res.data.data || []);
        setTotal(res.data.pagination?.total || 0);
      } else {
        throw new Error(res.data?.error || 'Failed to fetch map-center records');
      }
    } catch (err) {
      console.error('activity-map fetch error', err);
      setError(err.message || 'Fetch failed');
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, geoSource, appId]);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderableCount = records.filter(
    (r) => r.userLocation?.latitude != null && r.mapCenter?.latitude != null
  ).length;

  const mapboxConfigured = !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', minHeight: 600 }}>
        <Box sx={{ p: 2, pb: 1, flexShrink: 0 }}>
          <Typography variant="h5" gutterBottom>
            Activity Map
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            User reported location (with GPS-accuracy radius) connected to the map center they were viewing.
            Both visitors and logged-in users. Drawn from the map-center-history stream for AppId {appId}.
          </Typography>

          {!mapboxConfigured && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</strong> is not set — falling back to OpenStreetMap tiles.
              Add the token to <code>.env.local</code> for the standard Mapbox style.
            </Alert>
          )}

          {/* Filter bar */}
          <Paper sx={{ p: 2, mb: 1 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <DatePicker
                label="Start"
                value={startDate}
                onChange={(d) => isValid(d) && setStartDate(d)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="Finish"
                value={endDate}
                onChange={(d) => isValid(d) && setEndDate(d)}
                slotProps={{ textField: { size: 'small' } }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel shrink>Geo source</InputLabel>
                <Select
                  value={geoSource}
                  label="Geo source"
                  displayEmpty
                  notched
                  onChange={(e) => setGeoSource(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="GoogleBrowser">Browser GPS</MenuItem>
                  <MenuItem value="GoogleGeolocation">Google IP</MenuItem>
                  <MenuItem value="IPInfoIO">IP lookup</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={fetchRecords}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  icon={<GpsFixedIcon sx={{ fontSize: 14 }} />}
                  label="Browser GPS"
                  sx={{ bgcolor: '#2e7d32', color: '#fff' }}
                />
                <Chip
                  size="small"
                  icon={<LocationOnIcon sx={{ fontSize: 14 }} />}
                  label="Google IP"
                  sx={{ bgcolor: '#1976d2', color: '#fff' }}
                />
                <Chip
                  size="small"
                  icon={<WifiIcon sx={{ fontSize: 14 }} />}
                  label="IP lookup"
                  sx={{ bgcolor: '#757575', color: '#fff' }}
                />
              </Stack>
            </Stack>

            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Range: <strong>{isValid(startDate) ? format(startDate, 'MMM d, yyyy') : '—'}</strong> → <strong>{isValid(endDate) ? format(endDate, 'MMM d, yyyy') : '—'}</strong>
                {' • '}
                Showing <strong>{renderableCount}</strong> of <strong>{total.toLocaleString()}</strong> records
                {records.length < total && ` (capped at ${DEFAULT_LIMIT} for this view)`}
                {' • '}
                Lines connect user → map center
              </Typography>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
        </Box>

        {/* Map area — rocking-chair layout: relative parent + absolute-fill child guarantees the
            MapContainer always has a concrete sized box to mount into, regardless of flex timing. */}
        <Box sx={{
          flexGrow: 1,
          position: 'relative',
          mx: 2,
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          minHeight: 500,
          overflow: 'hidden',
        }}>
          {loading && (
            <Box sx={{
              position: 'absolute', top: 8, right: 8, zIndex: 1000,
              bgcolor: 'background.paper', px: 1, py: 0.5, borderRadius: 1,
              display: 'flex', alignItems: 'center', gap: 1, boxShadow: 1,
            }}>
              <CircularProgress size={16} />
              <Typography variant="caption">Loading…</Typography>
            </Box>
          )}
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <ActivityMapView records={records} />
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
