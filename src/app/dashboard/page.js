'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, ToggleButtonGroup, ToggleButton, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import { usersApi, organizersApi, eventsApi } from '@/lib/api-client';
import StatusPanel from './components/StatusPanel';
import { useAppContext } from '@/lib/AppContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentApp } = useAppContext();
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [organizerFilter, setOrganizerFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Handle user filter change
  const handleUserFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setUserFilter(newFilter);
    }
  };
  
  // Handle organizer filter change
  const handleOrganizerFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setOrganizerFilter(newFilter);
    }
  };

  useEffect(() => {
    // Fetch real data from the backend
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Create promises for parallel API requests
        const requests = [
          // Fetch all users
          usersApi.getUsers(currentApp.id),
          // Fetch active users
          usersApi.getUsers(currentApp.id, true),
          // Fetch all organizers
          organizersApi.getOrganizers(currentApp.id),
          // Fetch active organizers
          organizersApi.getOrganizers(currentApp.id, true)
        ];
        
        // Execute all requests in parallel
        const [allUsers, activeUsers, allOrganizers, activeOrganizers] = await Promise.all(requests);
        
        console.log('Dashboard data received:', {
          allUsers: allUsers.length,
          activeUsers: activeUsers.length,
          allOrganizers: allOrganizers.length,
          activeOrganizers: activeOrganizers.length
        });
        
        // Calculate statistics
        const inactiveUsers = allUsers.filter(user => !user.active);
        const adminUsers = allUsers.filter(user => 
          user.roleIds?.some(role => 
            (typeof role === 'object' && 
             (role.roleName === 'SystemAdmin' || role.roleName === 'RegionalAdmin'))
          )
        );
        const organizerUsers = allUsers.filter(user => user.regionalOrganizerInfo?.organizerId);
        const inactiveOrganizers = allOrganizers.filter(org => !org.isActive);
        const pendingOrganizers = allOrganizers.filter(org => !org.isApproved);
        
        // Fetch real event data from backend
        const eventStats = await eventsApi.getEventCounts(currentApp.id);
        
        // Location data - using mock data as we don't have a specific API for these counts
        const locationStats = {
          countries: 1,
          regions: 9,
          divisions: 32,
          cities: 146
        };
        
        // Debug information
        console.log('Dashboard data details:', {
          users: {
            allUsers: allUsers.length > 0 ? `${allUsers.length} items` : 'empty array',
            firstUser: allUsers[0] ? `ID: ${allUsers[0].firebaseUserId || 'N/A'}` : 'none',
            activeUsers: activeUsers.length > 0 ? `${activeUsers.length} items` : 'empty array',
            inactiveUsers: inactiveUsers.length,
            adminUsers: adminUsers.length,
            organizerUsers: organizerUsers.length
          },
          organizers: {
            allOrganizers: allOrganizers.length > 0 ? `${allOrganizers.length} items` : 'empty array',
            firstOrganizer: allOrganizers[0] ? `ID: ${allOrganizers[0]._id || 'N/A'}` : 'none',
            activeOrganizers: activeOrganizers.length > 0 ? `${activeOrganizers.length} items` : 'empty array',
            inactiveOrganizers: inactiveOrganizers.length,
            pendingOrganizers: pendingOrganizers.length
          }
        });
        
        // Set stats for the dashboard
        setStats({
          users: {
            total: allUsers.length,
            active: activeUsers.length,
            inactive: inactiveUsers.length,
            admins: adminUsers.length,
            organizers: organizerUsers.length
          },
          locations: locationStats,
          organizers: {
            total: allOrganizers.length,
            active: activeOrganizers.length,
            inactive: inactiveOrganizers.length,
            pending: pendingOrganizers.length
          },
          events: eventStats
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data: " + (err.message || "Unknown error"));
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentApp.id]);

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

  // Get user count based on filter
  const getUserCount = () => {
    if (!stats) return 0;
    
    switch (userFilter) {
      case 'active':
        return stats.users.active;
      case 'inactive':
        return stats.users.inactive;
      default:
        return stats.users.total;
    }
  };

  // Get organizer count based on filter
  const getOrganizerCount = () => {
    if (!stats) return 0;
    
    switch (organizerFilter) {
      case 'active':
        return stats.organizers.active;
      case 'inactive':
        return stats.organizers.inactive;
      default:
        return stats.organizers.total;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        System overview for {currentApp.name}
      </Typography>
      
      <StatusPanel />
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Users Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper 
            sx={{ 
              p: 3, 
              display: 'flex',
              flexDirection: 'column',
              height: 180,
              borderTop: '4px solid #1976d2'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Users</Typography>
              <PeopleIcon color="primary" />
            </Box>
            <Typography variant="h3" sx={{ mt: 1 }}>{getUserCount()}</Typography>
            <Box sx={{ mt: 1 }}>
              <ToggleButtonGroup
                size="small"
                value={userFilter}
                exclusive
                onChange={handleUserFilterChange}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="active">Active</ToggleButton>
                <ToggleButton value="inactive">Inactive</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {stats.users.organizers} with organizer access
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
              height: 180,
              borderTop: '4px solid #9c27b0'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Locations</Typography>
              <LocationOnIcon sx={{ color: '#9c27b0' }} />
            </Box>
            <Typography variant="h3" sx={{ mt: 2 }}>{stats.locations.cities}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {stats.locations.cities} cities across {stats.locations.regions} regions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.locations.divisions} divisions total
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
              height: 180,
              borderTop: '4px solid #ed6c02'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Organizers</Typography>
              <BusinessIcon sx={{ color: '#ed6c02' }} />
            </Box>
            <Typography variant="h3" sx={{ mt: 1 }}>{getOrganizerCount()}</Typography>
            <Box sx={{ mt: 1 }}>
              <ToggleButtonGroup
                size="small"
                value={organizerFilter}
                exclusive
                onChange={handleOrganizerFilterChange}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="active">Active</ToggleButton>
                <ToggleButton value="inactive">Inactive</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Divider sx={{ my: 1 }} />
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
              height: 180,
              borderTop: '4px solid #2e7d32'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" color="text.secondary">Events</Typography>
              <EventIcon sx={{ color: '#2e7d32' }} />
            </Box>
            <Typography variant="h3" sx={{ mt: 2 }}>{stats.events.total}</Typography>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {stats.events.upcoming} upcoming events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.events.thisMonth} events this month
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Additional dashboard content would go here */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          System Statistics
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>User Analytics</Typography>
              <Typography variant="body2">
                <strong>Total Users:</strong> {stats.users.total}
              </Typography>
              <Typography variant="body2">
                <strong>Active Users:</strong> {stats.users.active} ({Math.round(stats.users.active / stats.users.total * 100)}%)
              </Typography>
              <Typography variant="body2">
                <strong>Admin Users:</strong> {stats.users.admins} ({Math.round(stats.users.admins / stats.users.total * 100)}%)
              </Typography>
              <Typography variant="body2">
                <strong>Users with Organizer Access:</strong> {stats.users.organizers} ({Math.round(stats.users.organizers / stats.users.total * 100)}%)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Organizer Analytics</Typography>
              <Typography variant="body2">
                <strong>Total Organizers:</strong> {stats.organizers.total}
              </Typography>
              <Typography variant="body2">
                <strong>Active Organizers:</strong> {stats.organizers.active} ({Math.round(stats.organizers.active / stats.organizers.total * 100)}%)
              </Typography>
              <Typography variant="body2">
                <strong>Inactive Organizers:</strong> {stats.organizers.inactive} ({Math.round(stats.organizers.inactive / stats.organizers.total * 100)}%)
              </Typography>
              <Typography variant="body2">
                <strong>Pending Approval:</strong> {stats.organizers.pending} ({Math.round(stats.organizers.pending / stats.organizers.total * 100)}%)
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}