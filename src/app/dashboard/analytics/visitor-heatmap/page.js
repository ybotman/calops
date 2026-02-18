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
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Visitor Heatmap Page
 * Shows a 7x24 matrix (day of week × hour) of visitor activity
 */
export default function VisitorHeatmapPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);

  // Fetch heatmap data from backend
  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/analytics/visitor-heatmap');
      const data = response.data;

      console.log('Heatmap API response:', data);

      if (data.success && data.data) {
        const { heatmap, peak, sources, totals } = data.data;

        // Convert heatmap object {Sunday: [...], Monday: [...]} to 7x24 array
        const matrix = DAYS.map(day => heatmap[day] || Array(24).fill(0));

        // Find max count for color scaling
        let maxCount = 0;
        matrix.forEach(row => {
          if (Array.isArray(row)) {
            row.forEach(count => {
              if (count > maxCount) maxCount = count;
            });
          }
        });

        setHeatmapData({
          matrix,
          maxCount,
          peak,
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
  }, []);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  // Get color intensity based on count
  const getColor = (count, maxCount) => {
    if (count === 0 || maxCount === 0) return '#f5f5f5';
    const intensity = count / maxCount;
    // Green gradient: lighter to darker
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
        <Typography variant="h4">
          Visitor Heatmap
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchHeatmapData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Heatmap */}
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
                  {heatmapData.peak?.timestamp || `${heatmapData.peak?.day} @ ${heatmapData.peak?.hour}:00`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Peak ({heatmapData.peak?.count} hits)
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
              Activity by Day of Week &amp; Hour (UTC)
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
              {/* Day label */}
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

              {/* Hour cells */}
              {HOURS.map(hour => {
                const count = heatmapData.matrix[dayIndex][hour];
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
                        backgroundColor: getColor(count, heatmapData.maxCount),
                        border: '1px solid #fff',
                        borderRadius: 0.5,
                        cursor: 'pointer',
                        transition: 'transform 0.1s',
                        '&:hover': {
                          transform: 'scale(1.2)',
                          zIndex: 1
                        }
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          ))}

          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Less</Typography>
            {['#f5f5f5', '#c8e6c9', '#81c784', '#4caf50', '#388e3c', '#1b5e20'].map((color, i) => (
              <Box
                key={i}
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: color,
                  borderRadius: 0.5
                }}
              />
            ))}
            <Typography variant="caption" color="text.secondary">More</Typography>
          </Box>
        </Paper>
        </>
      )}
    </Box>
  );
}
