'use client';

// CALOPS-61: Session Geo Distribution dashboard
// Reads from sessiongeoanalytics collection (CALBEAF-194).
// API endpoint: GET /api/analytics/session-geo (CALBEAF-195 — pending Fulton)
// Build order: (1) map, (2) source pie, (3) cascade histogram, (4) private relay %, (5) anon split

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import axios from 'axios';
import { useAppContext } from '@/lib/AppContext';
import { subDays } from 'date-fns';

// Reuse Activity Map view — same geoSource color scheme per GEO-CAPTURE-STANDARDS
const ActivityMapView = dynamic(() => import('../activity-map/ActivityMapView'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress />
    </Box>
  ),
});

// GEO-CAPTURE-STANDARDS canonical source keys
const SOURCE_COLORS = {
  GoogleBrowser:     '#2e7d32',
  GoogleGeolocation: '#1976d2',
  CloudflareEdge:    '#e65100',
  IPInfoIO:          '#424242',
  ModalPick:         '#7b1fa2',
  Unknown:           '#9e9e9e',
};

const TIME_OPTIONS = [
  { label: 'Today',  value: '1D' },
  { label: '7d',     value: '7D' },
  { label: '30d',    value: '1M' },
];

function timeRangeToFromTo(range) {
  const to = new Date();
  const from = { '1D': subDays(to, 1), '7D': subDays(to, 7), '1M': subDays(to, 30) }[range];
  if (!from) return {};
  return { from: from.toISOString(), to: to.toISOString() };
}

// Source pie — simple count by geoSource
function SourcePie({ records }) {
  const counts = useMemo(() => {
    const m = {};
    for (const r of records) {
      const src = r.geoSource || 'Unknown';
      m[src] = (m[src] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [records]);

  const total = records.length;
  if (total === 0) return <Typography color="text.secondary" py={2} textAlign="center">No data</Typography>;

  return (
    <Stack spacing={1}>
      {counts.map(([src, count]) => (
        <Box key={src} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: SOURCE_COLORS[src] || '#9e9e9e', flexShrink: 0 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
              <Typography variant="caption">{src}</Typography>
              <Typography variant="caption" fontWeight={600}>{count} ({Math.round(count / total * 100)}%)</Typography>
            </Box>
            <Box sx={{ height: 4, bgcolor: 'grey.200', borderRadius: 2 }}>
              <Box sx={{ height: 4, bgcolor: SOURCE_COLORS[src] || '#9e9e9e', borderRadius: 2, width: `${count / total * 100}%` }} />
            </Box>
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

// Cascade level histogram — L0–L5 bars
function CascadeHistogram({ records }) {
  const counts = useMemo(() => {
    const m = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of records) {
      const l = r.cascadeLevel ?? -1;
      if (l >= 0 && l <= 5) m[l]++;
    }
    return m;
  }, [records]);

  const max = Math.max(...Object.values(counts), 1);
  const labels = ['L0 Profile', 'L1 Saved', 'L2 GPS', 'L3 CF City', 'L4 CF Country', 'L5 Modal'];

  if (records.length === 0) return <Typography color="text.secondary" py={2} textAlign="center">No data</Typography>;

  return (
    <Stack spacing={0.75}>
      {[0, 1, 2, 3, 4, 5].map((l) => (
        <Box key={l} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ width: 80, flexShrink: 0, color: 'text.secondary' }}>{labels[l]}</Typography>
          <Box sx={{ flexGrow: 1, height: 16, bgcolor: 'grey.200', borderRadius: 1, position: 'relative' }}>
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, bgcolor: '#1976d2', borderRadius: 1, width: `${counts[l] / max * 100}%`, transition: 'width 0.3s' }} />
          </Box>
          <Typography variant="caption" sx={{ width: 36, textAlign: 'right', flexShrink: 0 }}>{counts[l]}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

export default function SessionGeoPage() {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  const [timeRange, setTimeRange] = useState('7D');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [endpointReady, setEndpointReady] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = timeRangeToFromTo(timeRange);
      // Paginate up to 1000 records (5 pages × 200 cap, same pattern as Activity Map)
      const all = [];
      for (let page = 0; page < 5; page++) {
        const params = new URLSearchParams({ appId, limit: '200', page: String(page) });
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const res = await axios.get(`/api/analytics/session-geo?${params}&_t=${Date.now()}`);
        if (!res.data?.success) throw new Error(res.data?.error || 'Endpoint not yet available');
        const batch = res.data.data || [];
        all.push(...batch);
        if (page === 0) setEndpointReady(true);
        if (batch.length < 200) break;
      }
      setRecords(all);
    } catch (err) {
      if (err.response?.status === 404) {
        setEndpointReady(false);
        setError('GET /api/analytics/session-geo not yet available — waiting on CALBEAF-195.');
      } else {
        setError(err.message || 'Fetch failed');
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [appId, timeRange]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Adapt sessiongeoanalytics records to ActivityMapView shape
  const mapRecords = useMemo(() => records
    .filter(r => r.lat != null && r.lng != null)
    .map((r, i) => ({
      id: r._id || `${r.visitorId}-${i}`,
      userLocation: { latitude: r.lat, longitude: r.lng, source: r.geoSource || 'Unknown' },
      mapCenter: null,
      firebaseUserId: r.userId || null,
      ip: null,
      timestamp: r.resolvedAt || r.createdAt,
    })), [records]);

  const privateRelayCount = useMemo(() => records.filter(r => r.isPrivateRelay).length, [records]);
  const anonCount = useMemo(() => records.filter(r => !r.userId).length, [records]);
  const loggedInCount = records.length - anonCount;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>Session Geo Distribution</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Where are ALL users (anonymous + logged-in) coming from on page load?
        Reads from <code>sessiongeoanalytics</code> — one record per visitor per day.
      </Typography>

      {/* Controls */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={timeRange} onChange={(_e, v) => v && setTimeRange(v)}>
          {TIME_OPTIONS.map(o => <ToggleButton key={o.value} value={o.value}>{o.label}</ToggleButton>)}
        </ToggleButtonGroup>
        <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={fetchRecords} disabled={loading}>
          Refresh
        </Button>
        {!loading && <Typography variant="caption" color="text.secondary">{records.length} sessions</Typography>}
        {loading && <CircularProgress size={16} />}
      </Stack>

      {error && (
        <Alert severity={endpointReady ? 'error' : 'info'} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 1. Session Geo Map */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Session Geo Map</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          One dot per session. Color = location source. Anonymous users included.
        </Typography>
        <Box sx={{ height: { xs: 320, md: 480 }, position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', inset: 0 }}>
            <ActivityMapView
              records={mapRecords}
              geoSources={null}
              mapMode="userLocation"
            />
          </Box>
        </Box>
      </Paper>

      {/* 2–5. Stats row */}
      <Grid container spacing={2}>
        {/* 2. Source Breakdown */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Location Source</Typography>
            <SourcePie records={records} />
          </Paper>
        </Grid>

        {/* 3. Cascade Histogram */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Cascade Level</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              How far down the resolution chain users fall before a city is resolved.
            </Typography>
            <CascadeHistogram records={records} />
          </Paper>
        </Grid>

        {/* 4. Private Relay % */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>Private Relay</Typography>
            <Typography variant="h3" sx={{ color: privateRelayCount / Math.max(records.length, 1) > 0.25 ? 'warning.main' : 'text.primary' }}>
              {records.length ? Math.round(privateRelayCount / records.length * 100) : '—'}
              {records.length ? '%' : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {privateRelayCount} of {records.length} sessions<br />iCloud Private Relay active
            </Typography>
          </Paper>
        </Grid>

        {/* 5. Anonymous vs Logged-in */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>User Type</Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip label="Anonymous" size="small" variant="outlined" />
                <Typography variant="body2" fontWeight={600}>{anonCount}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip label="Logged in" size="small" color="primary" variant="outlined" />
                <Typography variant="body2" fontWeight={600}>{loggedInCount}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
