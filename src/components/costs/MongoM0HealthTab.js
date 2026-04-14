'use client';

import {
  Box, Typography, Paper, Grid, LinearProgress, Chip, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, CircularProgress, Button, Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { useMongoHealth } from '@/lib/mongo-health/useMongoHealth';
import {
  calcStorageGauge, calcConnectionsGauge, calcOpsGauge, calcReplicationGauge,
  calcThrottlingBadge, calcUpgradeRecommendation, LEVELS
} from '@/lib/mongo-health/calc';

const LEVEL_META = {
  [LEVELS.CLEAN]: { color: 'success', icon: CheckCircleIcon, label: 'Clean' },
  [LEVELS.WATCH]: { color: 'warning', icon: WarningAmberIcon, label: 'Watch' },
  [LEVELS.CRIT]: { color: 'error', icon: ErrorIcon, label: 'Critical' },
  [LEVELS.UNKNOWN]: { color: 'default', icon: CheckCircleIcon, label: 'Unknown' }
};

function GaugeCard({ gauge }) {
  const meta = LEVEL_META[gauge.level];
  const Icon = meta.icon;
  const pct = Math.min(gauge.pct ?? 0, 100);

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Icon color={meta.color} fontSize="small" />
          <Typography variant="subtitle2">{gauge.label}</Typography>
        </Stack>
        <Typography variant="h6" sx={{ mb: 1 }}>{gauge.display}</Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          color={meta.color === 'default' ? 'inherit' : meta.color}
          sx={{ height: 8, borderRadius: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {pct.toFixed(0)}% of cap
        </Typography>
      </CardContent>
    </Card>
  );
}

function ThrottlingBadge({ badge }) {
  const meta = LEVEL_META[badge.level];
  const Icon = meta.icon;
  return (
    <Card variant="outlined" sx={{ height: '100%', borderColor: `${meta.color}.main`, borderWidth: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Icon color={meta.color} />
          <Typography variant="subtitle2">Throttling (app-layer proxy)</Typography>
        </Stack>
        <Chip label={meta.label} color={meta.color === 'default' ? 'default' : meta.color} size="small" sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary">p95 latency: {badge.p95}ms</Typography>
        <Typography variant="body2" color="text.secondary">Slow ops/5min (&gt;200ms): {badge.slow5}</Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>{badge.reason}</Typography>
      </CardContent>
    </Card>
  );
}

function UpgradeCard({ rec }) {
  if (!rec) return null;
  const severity = rec.urgency === 'now' ? 'error' : 'warning';
  const title = rec.urgency === 'now' ? 'Upgrade recommended NOW' : 'Plan upgrade soon';

  return (
    <Alert severity={severity} icon={<TrendingUpIcon />} sx={{ mb: 2 }}>
      <Typography variant="subtitle2">{title}: {rec.from.tier} → {rec.to.tier}</Typography>
      <Typography variant="body2">
        Fired by: <b>{rec.firedBy}</b>. {rec.rationale}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        Cost delta: <b>+${rec.costDelta}/mo</b> ({rec.from.tier} ${rec.from.monthlyCost} → {rec.to.tier} ${rec.to.monthlyCost}).
        In-place resize, no code change.
      </Typography>
      <Button
        variant="outlined"
        color={severity}
        size="small"
        endIcon={<OpenInNewIcon />}
        href="https://cloud.mongodb.com/"
        target="_blank"
        rel="noopener"
        sx={{ mt: 1 }}
      >
        Open Atlas cluster
      </Button>
    </Alert>
  );
}

function TopCollectionsTable({ rows }) {
  const sorted = [...(rows || [])].sort((a, b) => b.sizeBytes - a.sizeBytes).slice(0, 10);
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell>Collection</TableCell>
            <TableCell align="right">Size</TableCell>
            <TableCell align="right">Docs</TableCell>
            <TableCell align="right">Indexes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map(c => (
            <TableRow key={c.name} hover>
              <TableCell>{c.name}</TableCell>
              <TableCell align="right">{(c.sizeBytes / 1024 / 1024).toFixed(1)} MB</TableCell>
              <TableCell align="right">{c.count.toLocaleString()}</TableCell>
              <TableCell align="right">{c.nindexes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function MongoM0HealthTab({ config }) {
  const { data, loading, error } = useMongoHealth(config);

  if (!config?.enabled) {
    return <Alert severity="info">M0 Health panel disabled in config.</Alert>;
  }
  if (loading && !data) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">Failed to load M0 health: {error}</Alert>;
  }
  if (!data) return null;

  const storage = calcStorageGauge(data, config.limits);
  const conns = calcConnectionsGauge(data, config.limits);
  const ops = calcOpsGauge(data, config.limits);
  const repl = calcReplicationGauge(data, config.limits);
  const badge = calcThrottlingBadge(data, config.throttlingProxy);
  const rec = calcUpgradeRecommendation(
    [storage, conns, ops, repl], badge, config.tierLadder, config.upgradeTriggers, config.cluster.tier
  );

  return (
    <Box>
      {config.useMockData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Displaying <b>mock data</b> (CALBEAF-106 endpoint not live yet). Try <code>?mockState=watch</code> or <code>?mockState=throttling</code> to preview alert states.
        </Alert>
      )}

      <Typography variant="h6" sx={{ mb: 1 }}>
        {config.cluster.name} ({config.cluster.tier}, {config.cluster.region})
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
        Captured: {data.capturedAt} · Mongo {config.cluster.mongoVersion}
      </Typography>

      <UpgradeCard rec={rec} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}><GaugeCard gauge={storage} /></Grid>
        <Grid item xs={12} sm={6} md={3}><GaugeCard gauge={conns} /></Grid>
        <Grid item xs={12} sm={6} md={3}><GaugeCard gauge={ops} /></Grid>
        <Grid item xs={12} sm={6} md={3}><GaugeCard gauge={repl} /></Grid>
        <Grid item xs={12} md={6}><ThrottlingBadge badge={badge} /></Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1 }}>Top collections by size</Typography>
      <TopCollectionsTable rows={data.perCollection} />
    </Box>
  );
}
