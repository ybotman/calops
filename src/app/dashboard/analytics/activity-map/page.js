'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Autocomplete,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import RefreshIcon from '@mui/icons-material/Refresh';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WifiIcon from '@mui/icons-material/Wifi';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import HomeIcon from '@mui/icons-material/Home';
import axios from 'axios';
import { format, subDays, isValid } from 'date-fns';
import { useAppContext } from '@/lib/AppContext';

const ActivityMapView = dynamic(() => import('./ActivityMapView'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ),
});

const DEFAULT_LIMIT = 200;

const SOURCE_OPTIONS = [
  { key: 'GoogleBrowser',     label: 'Browser GPS', color: '#2e7d32' },
  { key: 'GoogleGeolocation', label: 'Google IP',   color: '#1976d2' },
  { key: 'IPInfoIO',          label: 'IP lookup',   color: '#757575' },
];
const ALL_SOURCE_KEYS = SOURCE_OPTIONS.map((s) => s.key);

function haversineKm(a, b) {
  if (a?.latitude == null || a?.longitude == null) return null;
  if (b?.latitude == null || b?.longitude == null) return null;
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export default function ActivityMapPage() {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Client-side filter state (no re-fetch on change)
  const [geoSources, setGeoSources] = useState(ALL_SOURCE_KEYS);
  const [minQty, setMinQty] = useState(1);
  const [ipFilter, setIpFilter] = useState('');
  const [viewportFilter, setViewportFilter] = useState(false);
  const [viewportBounds, setViewportBounds] = useState(null);
  const [localsOnly, setLocalsOnly] = useState(false);
  const [localsKm, setLocalsKm] = useState(50);

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
      // geoSource now filtered client-side, not server-side, so we can multi-select

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
  }, [startDate, endDate, appId]);

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-IP activity counts (drives QTY threshold + IP autocomplete)
  const ipCounts = useMemo(() => {
    const m = new Map();
    for (const r of records) {
      const ip = r.ip || 'unknown';
      m.set(ip, (m.get(ip) || 0) + 1);
    }
    return m;
  }, [records]);

  const ipOptions = useMemo(
    () =>
      Array.from(ipCounts.entries())
        .filter(([ip]) => ip && ip !== 'unknown')
        .sort((a, b) => b[1] - a[1])
        .map(([ip, n]) => ({ ip, count: n })),
    [ipCounts]
  );

  const maxIpCount = useMemo(() => {
    let max = 1;
    for (const n of ipCounts.values()) if (n > max) max = n;
    return max;
  }, [ipCounts]);

  // Filtered set actually rendered on map + counted in summary
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const userLat = r.userLocation?.latitude;
      const userLng = r.userLocation?.longitude;
      const mapLat = r.mapCenter?.latitude;
      const mapLng = r.mapCenter?.longitude;
      if (userLat == null || userLng == null || mapLat == null || mapLng == null) return false;

      const source = r.userLocation?.source;
      if (geoSources.length === 0) return false;
      if (source && !geoSources.includes(source)) return false;

      if (ipFilter && r.ip !== ipFilter) return false;

      const ipCount = ipCounts.get(r.ip || 'unknown') || 0;
      if (ipCount < minQty) return false;

      if (viewportFilter && viewportBounds) {
        if (userLat > viewportBounds.north || userLat < viewportBounds.south) return false;
        // Naive E/W check; ignore antimeridian wrap (acceptable for our user base)
        if (userLng > viewportBounds.east || userLng < viewportBounds.west) return false;
      }

      if (localsOnly) {
        const dist = haversineKm(r.userLocation, r.mapCenter);
        if (dist == null || dist > localsKm) return false;
      }

      return true;
    });
  }, [records, geoSources, ipFilter, minQty, viewportFilter, viewportBounds, localsOnly, localsKm, ipCounts]);

  const mapboxConfigured = !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const handleSourceToggle = (_e, next) => {
    // ToggleButtonGroup returns null when all unselected — keep at least one selected? Allow empty (hides all dots).
    setGeoSources(next || []);
  };

  const resetFilters = () => {
    setGeoSources(ALL_SOURCE_KEYS);
    setMinQty(1);
    setIpFilter('');
    setViewportFilter(false);
    setLocalsOnly(false);
    setLocalsKm(50);
  };

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

          {/* Filter bar — two rows */}
          <Paper sx={{ p: 2, mb: 1 }}>
            {/* Row 1: fetch controls */}
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
              <Button
                variant="contained"
                onClick={fetchRecords}
                startIcon={<RefreshIcon />}
                disabled={loading}
              >
                Refresh
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              <Button size="small" onClick={resetFilters} variant="outlined">
                Reset filters
              </Button>
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {/* Row 2: client-side filters */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
              {/* Geo source multi-select */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Map-center source
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={geoSources}
                  onChange={handleSourceToggle}
                  aria-label="Geo source filter"
                >
                  {SOURCE_OPTIONS.map((s) => (
                    <ToggleButton key={s.key} value={s.key} sx={{ textTransform: 'none', px: 1 }}>
                      {s.key === 'GoogleBrowser' && <GpsFixedIcon sx={{ fontSize: 14, mr: 0.5, color: s.color }} />}
                      {s.key === 'GoogleGeolocation' && <LocationOnIcon sx={{ fontSize: 14, mr: 0.5, color: s.color }} />}
                      {s.key === 'IPInfoIO' && <WifiIcon sx={{ fontSize: 14, mr: 0.5, color: s.color }} />}
                      {s.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* QTY threshold */}
              <Box sx={{ minWidth: 200, px: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Min events per IP: <strong>{minQty}</strong>
                </Typography>
                <Slider
                  size="small"
                  value={minQty}
                  onChange={(_e, v) => setMinQty(v)}
                  min={1}
                  max={Math.max(2, maxIpCount)}
                  valueLabelDisplay="auto"
                  marks={[{ value: 1, label: '1' }, { value: Math.max(2, maxIpCount), label: String(Math.max(2, maxIpCount)) }]}
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* IP filter */}
              <Autocomplete
                size="small"
                options={ipOptions}
                value={ipOptions.find((o) => o.ip === ipFilter) || null}
                onChange={(_e, v) => setIpFilter(v?.ip || '')}
                getOptionLabel={(o) => `${o.ip} (${o.count})`}
                isOptionEqualToValue={(a, b) => a.ip === b.ip}
                sx={{ minWidth: 220 }}
                renderInput={(params) => <TextField {...params} label="IP filter" placeholder="any" />}
                clearOnEscape
              />

              {/* Viewport toggle */}
              <Tooltip title="Show only dots whose user-location is inside the visible map area. Refreshes on pan/zoom.">
                <FormControlLabel
                  control={<Switch size="small" checked={viewportFilter} onChange={(e) => setViewportFilter(e.target.checked)} />}
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <CenterFocusStrongIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">Viewport only</Typography>
                    </Stack>
                  }
                />
              </Tooltip>

              {/* Locals-only toggle + km threshold */}
              <Tooltip title="Show only users whose location is within N km of the map center they were viewing — i.e., people looking at where they actually are.">
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={<Switch size="small" checked={localsOnly} onChange={(e) => setLocalsOnly(e.target.checked)} />}
                    label={
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <HomeIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2">Locals only</Typography>
                      </Stack>
                    }
                  />
                  {localsOnly && (
                    <TextField
                      size="small"
                      type="number"
                      label="km"
                      value={localsKm}
                      onChange={(e) => setLocalsKm(Math.max(1, Number(e.target.value) || 1))}
                      sx={{ width: 90 }}
                      inputProps={{ min: 1, max: 5000 }}
                    />
                  )}
                </Stack>
              </Tooltip>
            </Stack>

            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Range: <strong>{isValid(startDate) ? format(startDate, 'MMM d, yyyy') : '—'}</strong> → <strong>{isValid(endDate) ? format(endDate, 'MMM d, yyyy') : '—'}</strong>
                {' • '}
                Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> renderable / <strong>{total.toLocaleString()}</strong> total
                {records.length < total && ` (capped at ${DEFAULT_LIMIT} per fetch)`}
                {' • '}
                {ipCounts.size} distinct IPs in fetched window
              </Typography>
            </Box>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
        </Box>

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
            <ActivityMapView
              records={filteredRecords}
              onBoundsChange={setViewportBounds}
            />
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
