'use client';

import { useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Alert, Chip, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Divider, Tooltip
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import {
  computeMonthlyCost, INPUT_DEFAULTS, INPUT_SCHEMA, PRESETS
} from '@/lib/cost-model/formula';

function fmtMoney(n) {
  if (n < 0.01) return '$0.00';
  if (n < 10) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}

function InputField({ spec, value, onChange }) {
  return (
    <TextField
      label={spec.label}
      type="number"
      size="small"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      fullWidth
      inputProps={{ min: spec.min, max: spec.max, step: spec.step }}
      helperText={spec.unit}
    />
  );
}

export default function WhatIfTab({ config }) {
  const [inputs, setInputs] = useState(INPUT_DEFAULTS);

  const result = useMemo(() => {
    if (!config?.enabled) return null;
    return computeMonthlyCost(inputs, config.units);
  }, [inputs, config]);

  if (!config?.enabled) {
    return <Alert severity="info">What-if model disabled in config.</Alert>;
  }

  const applyPreset = (preset) => {
    setInputs(prev => ({ ...prev, ...preset }));
  };

  const perMemberCost = result && inputs.M > 0 ? result.total / inputs.M : 0;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }} icon={<CalculateIcon />}>
        Parametric cost projection using the formula in <b>{config.sourceDoc}</b> §5.
        Change any input to see live cost. Useful for stress-testing scale scenarios before committing to a tier upgrade.
      </Alert>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick presets</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        {PRESETS.map(p => (
          <Chip
            key={p.id}
            label={p.label}
            variant="outlined"
            clickable
            onClick={() => applyPreset(p)}
          />
        ))}
        <Chip
          label="Reset to defaults"
          variant="outlined"
          clickable
          color="default"
          icon={<RestartAltIcon />}
          onClick={() => setInputs(INPUT_DEFAULTS)}
        />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Inputs</Typography>
            <Grid container spacing={2}>
              {INPUT_SCHEMA.map(spec => (
                <Grid item xs={12} sm={6} key={spec.key}>
                  <InputField
                    spec={spec}
                    value={inputs[spec.key]}
                    onChange={v => setInputs(prev => ({ ...prev, [spec.key]: v }))}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Projected monthly cost</Typography>
              <Typography variant="h3" sx={{ my: 1 }}>{result ? fmtMoney(result.total) : '—'}</Typography>
              <Stack direction="row" spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Active: <b>{result?.derived.activeUsers.toLocaleString(undefined, {maximumFractionDigits: 0})}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Concurrent: <b>{result?.derived.avgConcurrent.toLocaleString(undefined, {maximumFractionDigits: 0})}</b>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Per member: <b>${perMemberCost.toFixed(4)}/mo</b>
                </Typography>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" display="block">
                Auto-selected Mongo tier: <b>{result?.mongoTier.tier}</b> (${result?.mongoTier.monthlyCost}/mo, up to {result?.mongoTier.maxMembers.toLocaleString()} members)
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="h6" sx={{ mb: 1 }}>
            Line-item breakdown
            <Tooltip title="Formula from METRICS_COST_MODEL.md §5. Unit costs pinned 2026-Q2; update in costs-config.json when vendor pricing changes.">
              <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, verticalAlign: 'middle', color: 'text.secondary' }} />
            </Tooltip>
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell>Line</TableCell>
                  <TableCell>Detail</TableCell>
                  <TableCell align="right">Monthly</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result?.lines.map(l => (
                  <TableRow key={l.id} hover>
                    <TableCell>{l.label}</TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{l.detail}</Typography></TableCell>
                    <TableCell align="right">{fmtMoney(l.cost)}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell colSpan={2}><b>Total</b></TableCell>
                  <TableCell align="right"><b>{result ? fmtMoney(result.total) : '—'}</b></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}
