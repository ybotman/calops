'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Divider,
  Button,
  Stack,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import { formatDistanceToNow, format } from 'date-fns';
import { adminApi } from '@/lib/api-client/index';
import { organizersApi, eventsApi } from '@/lib/api-client.js';
import { useAppContext } from '@/lib/AppContext';

/**
 * User Activity Page
 * Shows users sorted by last login with drill-down to user details
 */
export default function UserActivityPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  // Data state
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDetails, setUserDetails] = useState({});

  // Fetch user activity data
  const fetchActivityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUserActivity({
        appId,
        staleDays: 30,
        limit: 200,
        sort: 'lastLogin'
      });
      setActivityData(data);
    } catch (err) {
      console.error('Error fetching user activity:', err);
      setError(err.message || 'Failed to load user activity data');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  // Filter users based on tab and search
  const getFilteredUsers = () => {
    if (!activityData) return [];

    let users = [];
    switch (tabValue) {
      case 0: // All users (sorted by last login)
        users = activityData.users || [];
        break;
      case 1: // Stale users
        users = activityData.staleUsers || [];
        break;
      case 2: // Never logged in
        users = activityData.neverLoggedIn || [];
        break;
      default:
        users = activityData.users || [];
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      users = users.filter(user =>
        (user.displayName || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.firebaseUserId || '').toLowerCase().includes(term)
      );
    }

    return users;
  };

  // Handle user card expansion and load details
  const handleExpandUser = async (user) => {
    const userId = user.firebaseUserId;

    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }

    setExpandedUser(userId);

    // Load organizer and events if not already loaded
    if (!userDetails[userId]) {
      try {
        const details = { loading: true };
        setUserDetails(prev => ({ ...prev, [userId]: details }));

        // Fetch organizer info if user has organizerId
        let organizerInfo = null;
        if (user.organizerId) {
          try {
            const organizers = await organizersApi.getOrganizers(appId);
            organizerInfo = organizers.find(o => o._id === user.organizerId);
          } catch (e) {
            console.error('Error fetching organizer:', e);
          }
        }

        // Fetch events for this organizer
        let events = [];
        if (organizerInfo) {
          try {
            const eventsResponse = await eventsApi.getEvents({
              appId,
              organizerId: organizerInfo._id,
              limit: 10
            });
            events = eventsResponse.events || eventsResponse || [];
          } catch (e) {
            console.error('Error fetching events:', e);
          }
        }

        setUserDetails(prev => ({
          ...prev,
          [userId]: {
            loading: false,
            organizer: organizerInfo,
            events: Array.isArray(events) ? events : []
          }
        }));
      } catch (err) {
        console.error('Error loading user details:', err);
        setUserDetails(prev => ({
          ...prev,
          [userId]: { loading: false, error: err.message }
        }));
      }
    }
  };

  // Format last login time
  const formatLastLogin = (lastLoginAt) => {
    if (!lastLoginAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(lastLoginAt), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // Get status color based on days since login
  const getStatusColor = (daysSinceLogin, lastLoginAt) => {
    if (!lastLoginAt) return 'error';
    if (daysSinceLogin <= 7) return 'success';
    if (daysSinceLogin <= 30) return 'warning';
    return 'error';
  };

  // Render summary cards
  const renderSummary = () => {
    if (!activityData?.summary) return null;
    const { total, active, stale, neverLoggedIn } = activityData.summary;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #1976d2' }}>
            <Typography variant="h4">{total}</Typography>
            <Typography variant="body2" color="text.secondary">Total Users</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #2e7d32' }}>
            <Typography variant="h4">{active}</Typography>
            <Typography variant="body2" color="text.secondary">Active (30d)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #ed6c02' }}>
            <Typography variant="h4">{stale}</Typography>
            <Typography variant="body2" color="text.secondary">Stale ({'>'}30d)</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #d32f2f' }}>
            <Typography variant="h4">{neverLoggedIn}</Typography>
            <Typography variant="body2" color="text.secondary">Never Logged In</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render user card
  const renderUserCard = (user) => {
    const isExpanded = expandedUser === user.firebaseUserId;
    const details = userDetails[user.firebaseUserId];
    const statusColor = getStatusColor(user.daysSinceLogin, user.lastLoginAt);

    return (
      <Card key={user.firebaseUserId} sx={{ mb: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          {/* Main user info row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              cursor: 'pointer'
            }}
            onClick={() => handleExpandUser(user)}
          >
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="subtitle1" fontWeight="medium">
                  {user.displayName || 'Unnamed User'}
                </Typography>
                {user.organizerId && (
                  <Chip
                    icon={<BusinessIcon sx={{ fontSize: 14 }} />}
                    label="Organizer"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {user.email || 'No email'}
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                label={formatLastLogin(user.lastLoginAt)}
                size="small"
                color={statusColor}
                variant="outlined"
              />
              {user.loginCount > 0 && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  {user.loginCount} login{user.loginCount !== 1 ? 's' : ''}
                </Typography>
              )}
            </Box>

            <IconButton size="small" sx={{ ml: 1 }}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Expanded details */}
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1.5 }} />

            {details?.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : details?.error ? (
              <Alert severity="error" sx={{ my: 1 }}>{details.error}</Alert>
            ) : (
              <Box>
                {/* User details */}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Firebase ID:</strong> {user.firebaseUserId}
                </Typography>
                {user.createdAt && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Created:</strong> {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </Typography>
                )}
                {user.roleNames && user.roleNames.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <strong>Roles:</strong>{' '}
                    {user.roleNames.map(role => (
                      <Chip key={role} label={role} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </Box>
                )}

                {/* Organizer info */}
                {details?.organizer && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" /> Organizer Info
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {details.organizer.fullName || details.organizer.shortName}
                    </Typography>
                    {details.organizer.organizerTypes && (
                      <Box sx={{ mt: 0.5 }}>
                        {details.organizer.organizerTypes.isTeacher && <Chip label="Teacher" size="small" sx={{ mr: 0.5 }} />}
                        {details.organizer.organizerTypes.isDJ && <Chip label="DJ" size="small" sx={{ mr: 0.5 }} />}
                        {details.organizer.organizerTypes.isVenue && <Chip label="Venue" size="small" sx={{ mr: 0.5 }} />}
                        {details.organizer.organizerTypes.isOrchestra && <Chip label="Orchestra" size="small" sx={{ mr: 0.5 }} />}
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Events */}
                {details?.events && details.events.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" /> Recent Events ({details.events.length})
                    </Typography>
                    <Stack spacing={0.5}>
                      {details.events.slice(0, 5).map(event => (
                        <Box key={event._id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                            {event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {event.startDate && format(new Date(event.startDate), 'MMM d')}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}

                {!details?.organizer && user.organizerId && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Organizer ID: {user.organizerId} (details not found)
                  </Typography>
                )}
              </Box>
            )}
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  const filteredUsers = getFilteredUsers();

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          User Activity
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchActivityData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && !activityData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Content */}
      {activityData && (
        <>
          {/* Summary cards */}
          {renderSummary()}

          {/* Tabs and search */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              variant={isMobile ? 'fullWidth' : 'standard'}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                label={`All (${activityData.summary?.total || 0})`}
                icon={<PersonIcon />}
                iconPosition="start"
              />
              <Tab
                label={`Stale (${activityData.summary?.stale || 0})`}
                icon={<WarningIcon />}
                iconPosition="start"
              />
              <Tab
                label={`Never (${activityData.summary?.neverLoggedIn || 0})`}
                icon={<ErrorIcon />}
                iconPosition="start"
              />
            </Tabs>

            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Box>
          </Paper>

          {/* User list */}
          <Box sx={{ maxHeight: 'calc(100vh - 450px)', overflow: 'auto' }}>
            {filteredUsers.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No users found matching criteria
                </Typography>
              </Paper>
            ) : (
              filteredUsers.map(user => renderUserCard(user))
            )}
          </Box>

          {/* Generated timestamp */}
          {activityData.generatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Data generated: {format(new Date(activityData.generatedAt), 'MMM d, yyyy h:mm a')}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
