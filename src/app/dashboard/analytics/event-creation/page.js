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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import { useAppContext } from '@/lib/AppContext';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// UTC offset for Eastern Time
const ET_OFFSET = -5;

/**
 * Convert UTC heatmap to Eastern Time
 */
function convertToEasternTime(utcMatrix) {
  const etMatrix = DAYS.map(() => Array(24).fill(0));
  utcMatrix.forEach((dayData, utcDayIndex) => {
    dayData.forEach((count, utcHour) => {
      let etHour = utcHour + ET_OFFSET;
      let etDayIndex = utcDayIndex;
      if (etHour < 0) {
        etHour += 24;
        etDayIndex = (utcDayIndex - 1 + 7) % 7;
      } else if (etHour >= 24) {
        etHour -= 24;
        etDayIndex = (utcDayIndex + 1) % 7;
      }
      etMatrix[etDayIndex][etHour] += count;
    });
  });
  return etMatrix;
}

/**
 * Event Creation Analytics Page
 * Shows when events are created: 7x24 heatmap, top organizers, peaks
 */
export default function EventCreationPage() {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('90');
  const [timezoneMode, setTimezoneMode] = useState('boston'); // 'boston' or 'local'

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Boston mode uses UTC and converts; Local mode requests local time
      const timeType = timezoneMode === 'boston' ? 'zulu' : 'local';
      const response = await axios.get(`/api/analytics/event-creation?appId=${appId}&days=${timeRange}&timeType=${timeType}`);
      const result = response.data;

      if (result.success && result.data) {
        const { byDayOfWeek, byHour, topOrganizers, peak, totals } = result.data;

        // Convert byDayOfWeek object to array
        const rawMatrix = DAYS.map(day => byDayOfWeek?.[day] || Array(24).fill(0));

        // Convert to ET if in Boston mode, otherwise use as-is
        const matrix = timezoneMode === 'boston' ? convertToEasternTime(rawMatrix) : rawMatrix;

        // Find max for color scaling
        let maxCount = 0;
        matrix.forEach(row => row.forEach(c => { if (c > maxCount) maxCount = c; }));

        setData({
          matrix,
          maxCount,
          byHour,
          topOrganizers,
          peak,
          totals
        });
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      console.error('Error fetching event creation data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [appId, timeRange, timezoneMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get color intensity
  const getColor = (count, maxCount) => {
    if (count === 0 || maxCount === 0) return '#f5f5f5';
    const intensity = count / maxCount;
    if (intensity < 0.2) return '#bbdefb';
    if (intensity < 0.4) return '#64b5f6';
    if (intensity < 0.6) return '#2196f3';
    if (intensity < 0.8) return '#1976d2';
    return '#0d47a1';
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
        <Typography variant="h4">
          Event Creation Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, v) => v && setTimeRange(v)}
            size="small"
          >
            <ToggleButton value="30">30d</ToggleButton>
            <ToggleButton value="60">60d</ToggleButton>
            <ToggleButton value="90">90d</ToggleButton>
            <ToggleButton value="365">1yr</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={timezoneMode}
            exclusive
            onChange={(e, v) => v && setTimezoneMode(v)}
            size="small"
            color="primary"
          >
            <ToggleButton value="boston">Boston</ToggleButton>
            <ToggleButton value="local">Local</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && data && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #1976d2' }}>
                <Typography variant="h4">{data.totals?.total?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Events Created</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #2e7d32' }}>
                <Typography variant="h6">{data.peak?.dayOfWeek?.day || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Peak Day ({data.peak?.dayOfWeek?.count || 0})
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #ed6c02' }}>
                <Typography variant="h6">{data.peak?.hour?.hour ?? '-'}:00</Typography>
                <Typography variant="body2" color="text.secondary">
                  Peak Hour ({data.peak?.hour?.count || 0})
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #9c27b0' }}>
                <Typography variant="h6">{data.topOrganizers?.[0]?.shortName || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Top Creator ({data.topOrganizers?.[0]?.count || 0})
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Heatmap */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Event Creation by Day &amp; Hour ({timezoneMode === 'boston' ? 'Boston/Eastern Time' : 'User Local Time'})
                </Typography>

                {/* Hour labels */}
                <Box sx={{ display: 'flex', mb: 0.5, ml: 5 }}>
                  {HOURS.map(hour => (
                    <Box
                      key={hour}
                      sx={{
                        width: 28,
                        textAlign: 'center',
                        fontSize: '0.65rem',
                        color: 'text.secondary'
                      }}
                    >
                      {hour % 3 === 0 ? hour : ''}
                    </Box>
                  ))}
                </Box>

                {/* Matrix rows */}
                {DAY_LABELS.map((dayLabel, dayIndex) => (
                  <Box key={dayLabel} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography
                      sx={{
                        width: 40,
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        color: 'text.secondary'
                      }}
                    >
                      {dayLabel}
                    </Typography>
                    {HOURS.map(hour => {
                      const count = data.matrix[dayIndex]?.[hour] || 0;
                      return (
                        <Tooltip
                          key={hour}
                          title={`${DAYS[dayIndex]} ${hour}:00 — ${count} events`}
                          arrow
                        >
                          <Box
                            sx={{
                              width: 26,
                              height: 20,
                              backgroundColor: getColor(count, data.maxCount),
                              border: '1px solid #fff',
                              borderRadius: 0.5,
                              cursor: 'pointer',
                              transition: 'transform 0.1s',
                              '&:hover': { transform: 'scale(1.2)', zIndex: 1 }
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                ))}

                {/* Legend with scale */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, gap: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Scale:</Typography>
                  {[
                    { color: '#f5f5f5', threshold: 0 },
                    { color: '#bbdefb', threshold: 0.2 },
                    { color: '#64b5f6', threshold: 0.4 },
                    { color: '#2196f3', threshold: 0.6 },
                    { color: '#1976d2', threshold: 0.8 },
                    { color: '#0d47a1', threshold: 1.0 }
                  ].map(({ color, threshold }, i) => {
                    const value = Math.round(data.maxCount * threshold);
                    return (
                      <Tooltip key={i} title={`${value}+ events`} arrow>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box
                            sx={{
                              width: 20,
                              height: 16,
                              backgroundColor: color,
                              borderRadius: 0.5,
                              border: '1px solid #e0e0e0'
                            }}
                          />
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                            {value}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    (max: {data.maxCount})
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Top Organizers */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  Top Event Creators
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Organizer</TableCell>
                      <TableCell align="right">Events</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data.topOrganizers || []).slice(0, 10).map((org, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {org.shortName || org.fullName || 'Unknown'}
                        </TableCell>
                        <TableCell align="right">{org.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
