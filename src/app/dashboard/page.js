'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentApp, setCurrentApp] = useState('1'); // Default to TangoTiempo

  useEffect(() => {
    // In a real app, this would fetch actual stats from the backend
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock statistics data
        setStats({
          users: {
            total: 358,
            active: 289,
            admins: 12,
            organizers: 47
          },
          locations: {
            countries: 1,
            regions: 9,
            divisions: 32,
            cities: 146
          },
          organizers: {
            total: 78,
            active: 62,
            pending: 16
          },
          events: {
            total: 1245,
            upcoming: 423,
            thisMonth: 187
          }
        });
        setLoading(false);
      } catch (err) {
        setError("Failed to load dashboard data");
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentApp]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        System overview for {currentApp === '1' ? 'TangoTiempo' : 'HarmonyJunction'}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Users Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid #1976d2'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Users</Typography>
              <PeopleIcon color="primary" />
            </Box>
            <Typography variant="h3" sx={{ mt: 2 }}>{stats.users.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.users.active} active users
            </Typography>
          </Paper>
        </Grid>
        
        {/* Locations Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid #9c27b0'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Locations</Typography>
              <LocationOnIcon sx={{ color: '#9c27b0' }} />
            </Box>
            <Typography variant="h3" sx={{ mt: 2 }}>{stats.locations.cities}</Typography>
            <Typography variant="body2" color="text.secondary">
              Across {stats.locations.regions} regions
            </Typography>
          </Paper>
        </Grid>
        
        {/* Organizers Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid #ed6c02'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Organizers</Typography>
              <BusinessIcon sx={{ color: '#ed6c02' }} />
            </Box>
            <Typography variant="h3" sx={{ mt: 2 }}>{stats.organizers.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.organizers.pending} pending approval
            </Typography>
          </Paper>
        </Grid>
        
        {/* Events Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderTop: '4px solid #2e7d32'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Events</Typography>
              <EventIcon sx={{ color: '#2e7d32' }} />
            </Box>
            <Typography variant="h3" sx={{ mt: 2 }}>{stats.events.total}</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.events.upcoming} upcoming events
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Additional dashboard content would go here */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activity
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography>
            Dashboard is in development. More features coming soon.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}