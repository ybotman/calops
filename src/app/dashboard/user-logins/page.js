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
import CancelIcon from '@mui/icons-material/Cancel';
import BusinessIcon from '@mui/icons-material/Business';
import EventIcon from '@mui/icons-material/Event';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import { formatDistanceToNow, format } from 'date-fns';
import { adminApi } from '@/lib/api-client/index';
import { organizersApi, eventsApi } from '@/lib/api-client.js';
import { useAppContext } from '@/lib/AppContext';

/**
 * User Logins Page
 * Shows users sorted by last login with drill-down to user details
 */
export default function UserLoginsPage() {
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

    // Sort by lastLoginAt descending (newest first)
    users = [...users].sort((a, b) => {
      if (!a.lastLoginAt && !b.lastLoginAt) return 0;
      if (!a.lastLoginAt) return 1;
      if (!b.lastLoginAt) return -1;
      return new Date(b.lastLoginAt) - new Date(a.lastLoginAt);
    });

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

  // Render compact user row
  const renderUserCard = (user) => {
    const isExpanded = expandedUser === user.firebaseUserId;
    const details = userDetails[user.firebaseUserId];
    const statusColor = getStatusColor(user.daysSinceLogin, user.lastLoginAt);

    return (
      <Paper
        key={user.firebaseUserId}
        sx={{
          mb: 0.5,
          p: 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' }
        }}
        onClick={() => handleExpandUser(user)}
        elevation={0}
        variant="outlined"
      >
        {/* Compact single line */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ minWidth: 90, color: 'text.secondary', fontSize: '0.75rem' }}>
            {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM d, h:mm a') : 'Never'}
          </Typography>
          <Typography variant="body2" fontWeight="medium" sx={{ flex: 1, minWidth: 150 }} noWrap>
            {user.displayName || 'Unnamed'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 180 }} noWrap>
            {user.email || '-'}
          </Typography>
          {user.organizerId && (
            <Chip label="Org" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
          )}
          <Chip
            label={user.loginCount || 0}
            size="small"
            sx={{ height: 20, minWidth: 30, fontSize: '0.65rem' }}
          />
          <Box sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: statusColor === 'success' ? 'success.main' : statusColor === 'warning' ? 'warning.main' : 'error.main'
          }} />
          <ExpandMoreIcon
            sx={{
              fontSize: 18,
              transform: isExpanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }}
          />
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
                {user.lastLoginAt && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Last Login:</strong> {format(new Date(user.lastLoginAt), 'MMM d, yyyy h:mm a')}
                  </Typography>
                )}
                {user.loginCount > 0 && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Total Logins:</strong> {user.loginCount}
                  </Typography>
                )}

                {/* Roles with codes */}
                {user.roleNames && user.roleNames.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon fontSize="small" /> Roles
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {user.roleNames.map(role => {
                        const roleCode = {
                          'NamedUser': 'NU',
                          'RegionalOrganizer': 'RO',
                          'RegionalAdmin': 'RA',
                          'SystemAdmin': 'SA',
                          'SystemOwner': 'SO'
                        }[role] || role;
                        const roleColor = {
                          'SystemOwner': 'error',
                          'SystemAdmin': 'warning',
                          'RegionalAdmin': 'info',
                          'RegionalOrganizer': 'primary',
                          'NamedUser': 'default'
                        }[role] || 'default';
                        return (
                          <Chip
                            key={role}
                            label={`${roleCode} (${role})`}
                            size="small"
                            color={roleColor}
                            variant="outlined"
                          />
                        );
                      })}
                    </Box>
                  </Paper>
                )}

                {/* User Status Booleans (localUserInfo) */}
                {user.localUserInfo && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" /> User Status
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        icon={user.localUserInfo.isApproved ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Approved"
                        size="small"
                        color={user.localUserInfo.isApproved ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        icon={user.localUserInfo.isEnabled ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Enabled"
                        size="small"
                        color={user.localUserInfo.isEnabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        icon={user.localUserInfo.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Active"
                        size="small"
                        color={user.localUserInfo.isActive ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Paper>
                )}

                {/* Regional Organizer Info with Booleans */}
                {user.regionalOrganizerInfo && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" /> Regional Organizer Status
                    </Typography>
                    {user.regionalOrganizerInfo.organizerId && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Organizer ID:</strong> {user.regionalOrganizerInfo.organizerId}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        icon={user.regionalOrganizerInfo.isApproved ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Approved"
                        size="small"
                        color={user.regionalOrganizerInfo.isApproved ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        icon={user.regionalOrganizerInfo.isEnabled ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Enabled"
                        size="small"
                        color={user.regionalOrganizerInfo.isEnabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        icon={user.regionalOrganizerInfo.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Active"
                        size="small"
                        color={user.regionalOrganizerInfo.isActive ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Paper>
                )}

                {/* Local Admin Info with Booleans */}
                {user.localAdminInfo && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettingsIcon fontSize="small" /> Local Admin Status
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        icon={user.localAdminInfo.isApproved ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Approved"
                        size="small"
                        color={user.localAdminInfo.isApproved ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        icon={user.localAdminInfo.isEnabled ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Enabled"
                        size="small"
                        color={user.localAdminInfo.isEnabled ? 'success' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        icon={user.localAdminInfo.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        label="Active"
                        size="small"
                        color={user.localAdminInfo.isActive ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Paper>
                )}

                {/* Organizer details from API lookup */}
                {details?.organizer && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon fontSize="small" /> Organizer Details
                    </Typography>
                    <Typography variant="body2">
                      <strong>Name:</strong> {details.organizer.fullName || details.organizer.shortName}
                    </Typography>
                    {details.organizer.organizerTypes && (
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip
                          icon={details.organizer.organizerTypes.isTeacher ? <CheckCircleIcon /> : <CancelIcon />}
                          label="Teacher"
                          size="small"
                          color={details.organizer.organizerTypes.isTeacher ? 'primary' : 'default'}
                          variant="outlined"
                        />
                        <Chip
                          icon={details.organizer.organizerTypes.isDJ ? <CheckCircleIcon /> : <CancelIcon />}
                          label="DJ"
                          size="small"
                          color={details.organizer.organizerTypes.isDJ ? 'primary' : 'default'}
                          variant="outlined"
                        />
                        <Chip
                          icon={details.organizer.organizerTypes.isVenue ? <CheckCircleIcon /> : <CancelIcon />}
                          label="Venue"
                          size="small"
                          color={details.organizer.organizerTypes.isVenue ? 'primary' : 'default'}
                          variant="outlined"
                        />
                        <Chip
                          icon={details.organizer.organizerTypes.isOrchestra ? <CheckCircleIcon /> : <CancelIcon />}
                          label="Orchestra"
                          size="small"
                          color={details.organizer.organizerTypes.isOrchestra ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Events - Date before title */}
                {details?.events && details.events.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon fontSize="small" /> Recent Events ({details.events.length})
                    </Typography>
                    <Stack spacing={0.5}>
                      {details.events.slice(0, 5).map(event => (
                        <Box key={event._id} sx={{ display: 'flex', gap: 1 }}>
                          <Typography variant="body2" color="primary" sx={{ minWidth: 60, fontWeight: 'medium' }}>
                            {event.startDate && format(new Date(event.startDate), 'MMM d')}
                          </Typography>
                          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                            {event.title}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}

                {!details?.organizer && user.organizerId && !user.regionalOrganizerInfo && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Organizer ID: {user.organizerId} (details not found)
                  </Typography>
                )}
              </Box>
            )}
          </Collapse>
      </Paper>
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
          User Logins
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
              <>
                {/* Header row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderBottom: 1, borderColor: 'divider', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ minWidth: 90, fontWeight: 'bold' }}>Last Login</Typography>
                  <Typography variant="caption" sx={{ flex: 1, minWidth: 150, fontWeight: 'bold' }}>Name</Typography>
                  <Typography variant="caption" sx={{ flex: 1, minWidth: 180, fontWeight: 'bold' }}>Email</Typography>
                  <Typography variant="caption" sx={{ width: 35, fontWeight: 'bold' }}>Org</Typography>
                  <Typography variant="caption" sx={{ width: 30, fontWeight: 'bold' }}>#</Typography>
                  <Typography variant="caption" sx={{ width: 26, fontWeight: 'bold' }}></Typography>
                </Box>
                {filteredUsers.map(user => renderUserCard(user))}
              </>
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
