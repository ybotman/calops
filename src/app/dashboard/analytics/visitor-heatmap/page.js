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
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DOM_LABELS = Array.from({ length: 31 }, (_, i) => i + 1);

// Boston/Eastern Time offset (EST = -5, EDT = -4)
const ET_OFFSET = -5;

/**
 * Convert UTC heatmap to Boston/Eastern Time (for DOW)
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
 * Convert UTC DOM heatmap to Eastern Time
 */
function convertDomToEasternTime(utcDomHeatmap) {
  const etMatrix = {};
  for (let d = 1; d <= 31; d++) {
    etMatrix[d] = Array(24).fill(0);
  }

  Object.entries(utcDomHeatmap || {}).forEach(([day, hourCounts]) => {
    const dayNum = parseInt(day);
    (hourCounts || []).forEach((count, utcHour) => {
      let etHour = utcHour + ET_OFFSET;
      let etDay = dayNum;
      if (etHour < 0) {
        etHour += 24;
        etDay = dayNum - 1;
        if (etDay < 1) etDay = 31;
      }
      if (etMatrix[etDay]) {
        etMatrix[etDay][etHour] += count;
      }
    });
  });
  return etMatrix;
}

// Helper for ordinal suffixes
function getOrdinalSuffix(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Visitor Heatmap Page
 * Shows DOW (7x24) or DOM (31x24) matrix of visitor activity
 */
export default function VisitorHeatmapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [timeRange, setTimeRange] = useState('3M');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [timezoneMode, setTimezoneMode] = useState('boston');
  const [viewMode, setViewMode] = useState('dow'); // 'dow' or 'dom'

  const handleTimeRangeChange = (event, newValue) => {
    if (newValue) setTimeRange(newValue);
  };

  const handleSourceFilterChange = (event, newValue) => {
    if (newValue) setSourceFilter(newValue);
  };

  const handleTimezoneModeChange = (event, newValue) => {
    if (newValue) setTimezoneMode(newValue);
  };

  const handleViewModeChange = (event, newValue) => {
    if (newValue) setViewMode(newValue);
  };

  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const includeLogins = sourceFilter === 'all' || sourceFilter === 'logins';
      const includeVisitors = sourceFilter === 'all' || sourceFilter === 'visitors';
      const timeType = timezoneMode === 'boston' ? 'zulu' : 'local';

      const response = await axios.get(
        `/api/analytics/visitor-heatmap?range=${timeRange}&includeLogins=${includeLogins}&includeVisitors=${includeVisitors}&timeType=${timeType}&_t=${Date.now()}`
      );
      const data = response.data;

      if (data.success && data.data) {
        const { heatmap, domHeatmap, peak, domPeak, sources, totals } = data.data;

        // Convert DOW heatmap
        const rawDowMatrix = DAYS.map(day => heatmap[day] || Array(24).fill(0));
        const dowMatrix = timezoneMode === 'boston' ? convertToEasternTime(rawDowMatrix) : rawDowMatrix;

        // Convert DOM heatmap
        const domMatrix = timezoneMode === 'boston'
          ? convertDomToEasternTime(domHeatmap)
          : domHeatmap || {};

        // Format DOW peak
        let displayPeak = { ...peak };
        if (peak && timezoneMode === 'boston') {
          let displayHour = peak.hour + ET_OFFSET;
          let dayIndex = DAYS.indexOf(peak.day);
          if (displayHour < 0) {
            displayHour += 24;
            dayIndex = (dayIndex - 1 + 7) % 7;
          }
          const displayDay = DAYS[dayIndex];
          const period = displayHour >= 12 ? 'PM' : 'AM';
          const hour12 = displayHour % 12 || 12;
          displayPeak = {
            ...peak,
            day: displayDay,
            hour: displayHour,
            timestamp: `${displayDay} at ${hour12}:00 ${period} ET`
          };
        } else if (peak) {
          const period = peak.hour >= 12 ? 'PM' : 'AM';
          const hour12 = peak.hour % 12 || 12;
          displayPeak.timestamp = `${peak.day} at ${hour12}:00 ${period}`;
        }

        // Find max counts
        let dowMaxCount = 0;
        dowMatrix.forEach(row => {
          if (Array.isArray(row)) {
            row.forEach(count => { if (count > dowMaxCount) dowMaxCount = count; });
          }
        });

        let domMaxCount = 0;
        Object.values(domMatrix).forEach(row => {
          if (Array.isArray(row)) {
            row.forEach(count => { if (count > domMaxCount) domMaxCount = count; });
          }
        });

        setHeatmapData({
          dowMatrix,
          domMatrix,
          dowMaxCount,
          domMaxCount,
          peak: displayPeak,
          domPeak: domPeak || {},
          sources,
          totals
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      setError(err.message || 'Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  }, [timeRange, sourceFilter, timezoneMode]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  const getColor = (count, maxCount) => {
    if (count === 0 || maxCount === 0) return '#f5f5f5';
    const intensity = count / maxCount;
    if (intensity < 0.2) return '#c8e6c9';
    if (intensity < 0.4) return '#81c784';
    if (intensity < 0.6) return '#4caf50';
    if (intensity < 0.8) return '#388e3c';
    return '#1b5e20';
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
        <Typography variant="h4">Visitor Heatmap</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            <ToggleButton value="1H">1H</ToggleButton>
            <ToggleButton value="1D">1D</ToggleButton>
            <ToggleButton value="1W">1W</ToggleButton>
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="1Yr">1Yr</ToggleButton>
            <ToggleButton value="All">All</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={sourceFilter}
            exclusive
            onChange={handleSourceFilterChange}
            size="small"
            color="secondary"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="logins">Logins</ToggleButton>
            <ToggleButton value="visitors">Visitors</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            color="info"
          >
            <ToggleButton value="dow">DOW</ToggleButton>
            <ToggleButton value="dom">DOM</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={timezoneMode}
            exclusive
            onChange={handleTimezoneModeChange}
            size="small"
            color="primary"
          >
            <ToggleButton value="boston">Boston</ToggleButton>
            <ToggleButton value="local">Local</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchHeatmapData}
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

      {!loading && heatmapData && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #1976d2' }}>
                <Typography variant="h4">{heatmapData.sources?.total?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Events</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #2e7d32' }}>
                <Typography variant="h4">{heatmapData.sources?.userLogins?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">User Logins</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #ed6c02' }}>
                <Typography variant="h4">{heatmapData.sources?.anonymousVisitors?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Anonymous Visitors</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #9c27b0' }}>
                <Typography variant="h6">
                  {viewMode === 'dow'
                    ? (heatmapData.peak?.timestamp || `${heatmapData.peak?.day} @ ${heatmapData.peak?.hour}:00`)
                    : (heatmapData.domPeak?.day ? `${heatmapData.domPeak.day}${getOrdinalSuffix(heatmapData.domPeak.day)} @ ${heatmapData.domPeak.hour}:00` : '-')
                  }
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Peak ({viewMode === 'dow' ? heatmapData.peak?.count : heatmapData.domPeak?.count || 0} hits)
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Activity by {viewMode === 'dow' ? 'Day of Week' : 'Day of Month'} &amp; Hour
              ({timezoneMode === 'boston' ? 'Boston/Eastern Time' : 'User Local Time'})
            </Typography>

            {/* Hour labels */}
            <Box sx={{ display: 'flex', mb: 0.5, ml: viewMode === 'dow' ? 5 : 4 }}>
              {HOURS.map(hour => (
                <Box
                  key={hour}
                  sx={{
                    width: viewMode === 'dow' ? 28 : 22,
                    textAlign: 'center',
                    fontSize: '0.65rem',
                    color: 'text.secondary'
                  }}
                >
                  {hour % 3 === 0 ? hour : ''}
                </Box>
              ))}
            </Box>

            {/* DOW Matrix rows */}
            {viewMode === 'dow' && DAY_LABELS.map((dayLabel, dayIndex) => (
              <Box key={dayLabel} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ width: 40, fontSize: '0.75rem', fontWeight: 'medium', color: 'text.secondary' }}>
                  {dayLabel}
                </Typography>
                {HOURS.map(hour => {
                  const count = heatmapData.dowMatrix[dayIndex]?.[hour] || 0;
                  return (
                    <Tooltip key={hour} title={`${DAYS[dayIndex]} ${hour}:00 — ${count} events`} arrow>
                      <Box
                        sx={{
                          width: 26,
                          height: 20,
                          backgroundColor: getColor(count, heatmapData.dowMaxCount),
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

            {/* DOM Matrix rows */}
            {viewMode === 'dom' && DOM_LABELS.map(dayNum => (
              <Box key={dayNum} sx={{ display: 'flex', alignItems: 'center', mb: 0.25 }}>
                <Typography sx={{ width: 28, fontSize: '0.7rem', fontWeight: 'medium', color: 'text.secondary', textAlign: 'right', pr: 1 }}>
                  {dayNum}
                </Typography>
                {HOURS.map(hour => {
                  const count = heatmapData.domMatrix[dayNum]?.[hour] || 0;
                  return (
                    <Tooltip key={hour} title={`${dayNum}${getOrdinalSuffix(dayNum)} at ${hour}:00 — ${count} events`} arrow>
                      <Box
                        sx={{
                          width: 20,
                          height: 14,
                          backgroundColor: getColor(count, heatmapData.domMaxCount),
                          border: '1px solid #fff',
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          transition: 'transform 0.1s',
                          '&:hover': { transform: 'scale(1.3)', zIndex: 1 }
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            ))}

            {/* Legend */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>Scale:</Typography>
              {[
                { color: '#f5f5f5', threshold: 0 },
                { color: '#c8e6c9', threshold: 0.2 },
                { color: '#81c784', threshold: 0.4 },
                { color: '#4caf50', threshold: 0.6 },
                { color: '#388e3c', threshold: 0.8 },
                { color: '#1b5e20', threshold: 1.0 }
              ].map(({ color, threshold }, i) => {
                const maxCount = viewMode === 'dow' ? heatmapData.dowMaxCount : heatmapData.domMaxCount;
                const value = Math.round(maxCount * threshold);
                return (
                  <Tooltip key={i} title={`${value}+ events`} arrow>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 20, height: 16, backgroundColor: color, borderRadius: 0.5, border: '1px solid #e0e0e0' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>{value}</Typography>
                    </Box>
                  </Tooltip>
                );
              })}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (max: {viewMode === 'dow' ? heatmapData.dowMaxCount : heatmapData.domMaxCount})
              </Typography>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
