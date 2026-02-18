'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppContext } from '@/lib/AppContext';
import { adminApi } from '@/lib/api-client/index';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * Visitor Heatmap Page
 * Shows a 7x24 matrix (day of week × hour) of user last login times
 */
export default function VisitorHeatmapPage() {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [timeRange, setTimeRange] = useState('all');

  // Fetch user activity data and aggregate by day/hour
  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user activity data
      const response = await adminApi.getUserActivity({
        appId,
        staleDays: 365,
        limit: 1000,
        sort: 'lastLogin'
      });

      const users = response.users || [];

      // Calculate date filter
      const now = new Date();
      const filterDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 9999;
      const cutoffDate = new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000);

      // Initialize 7x24 matrix with zeros
      const matrix = DAYS.map(() => HOURS.map(() => 0));
      let maxCount = 0;
      let totalUsers = 0;

      // Aggregate by day of week and hour of last login
      users.forEach(user => {
        const timestamp = user.lastLoginAt;
        if (timestamp) {
          const date = new Date(timestamp);
          // Apply time filter
          if (date >= cutoffDate) {
            const dayOfWeek = date.getDay(); // 0-6 (Sun-Sat)
            const hour = date.getHours(); // 0-23
            matrix[dayOfWeek][hour]++;
            totalUsers++;
            if (matrix[dayOfWeek][hour] > maxCount) {
              maxCount = matrix[dayOfWeek][hour];
            }
          }
        }
      });

      setHeatmapData({
        matrix,
        maxCount,
        totalUsers,
        totalInDb: users.length
      });
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      setError(err.message || 'Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  }, [appId, timeRange]);

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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, v) => v && setTimeRange(v)}
            size="small"
          >
            <ToggleButton value="7d">7 Days</ToggleButton>
            <ToggleButton value="30d">30 Days</ToggleButton>
            <ToggleButton value="90d">90 Days</ToggleButton>
            <ToggleButton value="all">All Time</ToggleButton>
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
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Last Login Times by Day &amp; Hour (local) — {heatmapData.totalUsers.toLocaleString()} users
            {heatmapData.totalInDb !== heatmapData.totalUsers && ` (${heatmapData.totalInDb} total)`}
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
          {DAYS.map((day, dayIndex) => (
            <Box key={day} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              {/* Day label */}
              <Typography
                sx={{
                  width: 40,
                  fontSize: '0.75rem',
                  fontWeight: 'medium',
                  color: 'text.secondary'
                }}
              >
                {day}
              </Typography>

              {/* Hour cells */}
              {HOURS.map(hour => {
                const count = heatmapData.matrix[dayIndex][hour];
                return (
                  <Tooltip
                    key={hour}
                    title={`${day} ${hour}:00 — ${count} events`}
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
      )}
    </Box>
  );
}
