'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';
import { format } from 'date-fns';
import usersApi from '@/lib/api-client/users';
import organizersApi from '@/lib/api-client/organizers';
import { useAuth } from '@/contexts/AuthContext';
import LockIcon from '@mui/icons-material/Lock';

/**
 * PII Masking utilities for ReadUser role
 */
const maskIP = (ip) => {
  if (!ip) return '-';
  // Show first octet, mask the rest: 192.xxx.xxx.xxx
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.•••.•••.•••`;
  }
  return '•••.•••.•••.•••';
};

const maskEmail = (email) => {
  if (!email) return '-';
  const [local, domain] = email.split('@');
  if (!domain) return '•••@•••';
  const maskedLocal = local.length > 2 ? `${local[0]}•••${local[local.length - 1]}` : '•••';
  return `${maskedLocal}@${domain}`;
};

const maskName = (name) => {
  if (!name) return '-';
  if (name.length <= 2) return '•••';
  return `${name[0]}${'•'.repeat(name.length - 2)}${name[name.length - 1]}`;
};

const maskId = (id) => {
  if (!id) return '-';
  if (id.length <= 8) return '••••••••';
  return `${id.slice(0, 4)}••••••••`;
};

/**
 * Unified User Activity Page
 * Search by userId, IP, or visitorId to see all related activity
 * Cross-references login history and visitor history via IP
 * Shows Firebase info, UserLogin info, and Organizer details
 */
export default function UserActivityPage() {
  const { user } = useAuth();
  const [searchType, setSearchType] = useState('ip');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Role-based access: SA/SO = full access, RU/RA = masked PII
  const userRoles = user?.roles || [];
  const hasFullAccess = userRoles.some(role =>
    ['SystemAdmin', 'SA', 'SystemOwner', 'SO'].includes(role)
  );
  const isReadOnly = !hasFullAccess; // RU, RA, or any other role = masked view

  // Masking functions based on role
  const m = {
    ip: (val) => isReadOnly ? maskIP(val) : (val || '-'),
    email: (val) => isReadOnly ? maskEmail(val) : (val || '-'),
    name: (val) => isReadOnly ? maskName(val) : (val || '-'),
    id: (val) => isReadOnly ? maskId(val) : (val || '-'),
    username: (val) => isReadOnly ? maskName(val) : (val || '-')
  };
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Fetch login history with filters
  const fetchLoginHistory = async (filters) => {
    const params = new URLSearchParams({ range: 'All', limit: '100', ...filters });
    const response = await axios.get(`/api/analytics/login-history?${params}`);
    return response.data?.data || [];
  };

  // Fetch visitor history with filters
  const fetchVisitorHistory = async (filters) => {
    const params = new URLSearchParams({ range: 'All', limit: '100', ...filters });
    const response = await axios.get(`/api/analytics/visitor-history?${params}`);
    return response.data?.data || [];
  };

  // Fetch user and organizer details for identified users
  const fetchUserDetails = async (userIds) => {
    if (!userIds || userIds.length === 0) {
      setUserDetails(null);
      return;
    }

    setDetailsLoading(true);
    try {
      const details = { users: [], organizers: [] };

      // Fetch user login info for each firebaseUserId
      for (const firebaseUserId of userIds) {
        try {
          // Try appId 1 first, then 2
          let user = await usersApi.getUserById(firebaseUserId, '1');
          if (!user) {
            user = await usersApi.getUserById(firebaseUserId, '2');
          }
          if (user) {
            details.users.push(user);
          }
        } catch (err) {
          console.log(`Could not fetch user ${firebaseUserId}:`, err.message);
        }
      }

      // Fetch organizers that match these firebaseUserIds
      try {
        const allOrganizers1 = await organizersApi.getOrganizers('1', undefined, true);
        const allOrganizers2 = await organizersApi.getOrganizers('2', undefined, true);
        const allOrganizers = [...allOrganizers1, ...allOrganizers2];

        details.organizers = allOrganizers.filter(org =>
          org.firebaseUserId && userIds.includes(org.firebaseUserId)
        );
      } catch (err) {
        console.log('Could not fetch organizers:', err.message);
      }

      setUserDetails(details);
    } catch (err) {
      console.error('Error fetching user details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Main search handler
  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setUserDetails(null);

    try {
      let logins = [];
      let visits = [];
      let identifiedIPs = new Set();
      let identifiedUserIds = new Set();
      let identifiedVisitorIds = new Set();

      // Track discovery lineage
      const lineage = {
        searchType,
        searchValue: searchValue.trim(),
        directIPs: new Set(),      // IPs found directly from search
        usersFromIPs: new Set(),   // Users discovered from IPs
        expandedIPs: new Set(),    // Additional IPs from user history
        steps: []
      };

      if (searchType === 'userId') {
        // Search by Firebase User ID
        lineage.steps.push({ type: 'search', desc: `Searched User: ${searchValue.trim().slice(-8)}...` });
        identifiedUserIds.add(searchValue.trim());

        logins = await fetchLoginHistory({ firebaseUserId: searchValue.trim() });

        // Extract unique IPs from login records
        logins.forEach(l => {
          if (l.ip) {
            identifiedIPs.add(l.ip);
            lineage.directIPs.add(l.ip);
          }
          if (l.firebaseUserId) identifiedUserIds.add(l.firebaseUserId);
        });

        if (lineage.directIPs.size > 0) {
          lineage.steps.push({ type: 'found', desc: `User has ${lineage.directIPs.size} IP(s)`, ips: Array.from(lineage.directIPs) });
        }

        // Cross-reference: find visitor activity from same IPs
        for (const ip of identifiedIPs) {
          const ipVisits = await fetchVisitorHistory({ ip });
          ipVisits.forEach(v => {
            visits.push(v);
            if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
          });
        }

      } else if (searchType === 'ip') {
        // Search by IP - get both logins and visits for this IP
        lineage.directIPs.add(searchValue.trim());
        lineage.steps.push({ type: 'search', desc: `Searched IP: ${searchValue.trim()}` });

        const initialLogins = await fetchLoginHistory({ ip: searchValue.trim() });
        const initialVisits = await fetchVisitorHistory({ ip: searchValue.trim() });

        identifiedIPs.add(searchValue.trim());

        // Collect userIds from initial IP search
        initialLogins.forEach(l => {
          logins.push(l);
          if (l.firebaseUserId) {
            identifiedUserIds.add(l.firebaseUserId);
            lineage.usersFromIPs.add(l.firebaseUserId);
          }
        });
        initialVisits.forEach(v => {
          visits.push(v);
          if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
        });

        if (lineage.usersFromIPs.size > 0) {
          lineage.steps.push({ type: 'found', desc: `Found ${lineage.usersFromIPs.size} user(s) on this IP` });
        }

        // Deep cross-reference: for each user found, get ALL their logins to find other IPs
        for (const userId of identifiedUserIds) {
          const userLogins = await fetchLoginHistory({ firebaseUserId: userId });
          const newIPs = [];
          userLogins.forEach(l => {
            if (l.ip && !identifiedIPs.has(l.ip)) {
              identifiedIPs.add(l.ip);
              lineage.expandedIPs.add(l.ip);
              newIPs.push(l.ip);
            }
            if (!logins.find(existing => existing.id === l.id)) {
              logins.push(l);
            }
          });
          if (newIPs.length > 0) {
            lineage.steps.push({ type: 'expand', desc: `User ${userId.slice(-8)} → ${newIPs.length} more IP(s)`, ips: newIPs });
          }
        }

        // Now get visits from all discovered IPs
        for (const ip of identifiedIPs) {
          if (ip === searchValue.trim()) continue;
          const ipVisits = await fetchVisitorHistory({ ip });
          ipVisits.forEach(v => {
            if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
            if (!visits.find(existing => existing.id === v.id)) {
              visits.push(v);
            }
          });
        }

      } else if (searchType === 'visitorId') {
        // Search by Visitor ID
        lineage.steps.push({ type: 'search', desc: `Searched Visitor: ${searchValue.trim().slice(-8)}...` });

        const initialVisits = await fetchVisitorHistory({ visitorId: searchValue.trim() });

        // Extract unique IPs from visitor records
        initialVisits.forEach(v => {
          visits.push(v);
          if (v.ip) {
            identifiedIPs.add(v.ip);
            lineage.directIPs.add(v.ip);
          }
          if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
        });

        if (lineage.directIPs.size > 0) {
          lineage.steps.push({ type: 'found', desc: `Visitor has ${lineage.directIPs.size} IP(s)` });
        }

        // Cross-reference: find login activity from same IPs
        for (const ip of identifiedIPs) {
          const ipLogins = await fetchLoginHistory({ ip });
          ipLogins.forEach(l => {
            if (!logins.find(existing => existing.id === l.id)) {
              logins.push(l);
            }
            if (l.firebaseUserId) {
              identifiedUserIds.add(l.firebaseUserId);
              lineage.usersFromIPs.add(l.firebaseUserId);
            }
          });
        }

        if (lineage.usersFromIPs.size > 0) {
          lineage.steps.push({ type: 'found', desc: `Found ${lineage.usersFromIPs.size} logged-in user(s) on same IPs` });
        }

        // Deep cross-reference: for each user found, get ALL their logins to find other IPs
        for (const userId of identifiedUserIds) {
          const userLogins = await fetchLoginHistory({ firebaseUserId: userId });
          const newIPs = [];
          userLogins.forEach(l => {
            if (l.ip && !identifiedIPs.has(l.ip)) {
              identifiedIPs.add(l.ip);
              lineage.expandedIPs.add(l.ip);
              newIPs.push(l.ip);
            }
            if (!logins.find(existing => existing.id === l.id)) {
              logins.push(l);
            }
          });
          if (newIPs.length > 0) {
            lineage.steps.push({ type: 'expand', desc: `User ${userId.slice(-8)} → ${newIPs.length} more IP(s)` });
          }
        }

        // Get visits from any newly discovered IPs
        for (const ip of identifiedIPs) {
          const ipVisits = await fetchVisitorHistory({ ip });
          ipVisits.forEach(v => {
            if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
            if (!visits.find(existing => existing.id === v.id)) {
              visits.push(v);
            }
          });
        }
      }

      // Combine and sort by timestamp (newest first)
      const timeline = [
        ...logins.map(l => ({ ...l, type: 'login' })),
        ...visits.map(v => ({ ...v, type: 'visit' }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Deduplicate by id
      const seen = new Set();
      const dedupedTimeline = timeline.filter(item => {
        const key = `${item.type}-${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const userIdArray = Array.from(identifiedUserIds);

      setResults({
        timeline: dedupedTimeline,
        summary: {
          userIds: userIdArray,
          visitorIds: Array.from(identifiedVisitorIds),
          ips: Array.from(identifiedIPs),
          loginCount: logins.length,
          visitCount: visits.length
        },
        lineage: {
          searchType: lineage.searchType,
          searchValue: lineage.searchValue,
          directIPs: Array.from(lineage.directIPs),
          usersFromIPs: Array.from(lineage.usersFromIPs),
          expandedIPs: Array.from(lineage.expandedIPs),
          steps: lineage.steps
        }
      });

      // Fetch user details for identified users
      fetchUserDetails(userIdArray);

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search activity');
    } finally {
      setLoading(false);
    }
  }, [searchType, searchValue]);

  // Handle enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 2 }}>Unified User Activity</Typography>

      {/* Role-based access indicator */}
      {isReadOnly && (
        <Alert severity="info" icon={<LockIcon />} sx={{ mb: 2 }}>
          <strong>Read-Only Mode</strong> — PII and IP addresses are masked. Contact a System Admin for full access.
        </Alert>
      )}

      {/* Search Panel */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Search by Firebase User ID, IP address, or Visitor ID to see all related activity.
          Results are cross-referenced via IP to find connected sessions.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Search Type</InputLabel>
            <Select
              value={searchType}
              label="Search Type"
              onChange={(e) => setSearchType(e.target.value)}
            >
              <MenuItem value="ip">IP Address</MenuItem>
              <MenuItem value="userId">Firebase User ID</MenuItem>
              <MenuItem value="visitorId">Visitor ID</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label={searchType === 'ip' ? 'IP Address' : searchType === 'userId' ? 'Firebase User ID' : 'Visitor ID'}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={searchType === 'ip' ? '71.232.30.16' : searchType === 'userId' ? 'abc123...' : 'uuid...'}
            sx={{ flex: 1, minWidth: 250 }}
          />

          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading || !searchValue.trim()}
          >
            Search
          </Button>
        </Box>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Discovery Lineage */}
          {results.lineage && results.lineage.steps.length > 0 && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountTreeIcon /> Discovery Chain
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {results.lineage.steps.map((step, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {i > 0 && <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
                    <Chip
                      label={step.desc}
                      size="small"
                      color={step.type === 'search' ? 'primary' : step.type === 'found' ? 'success' : 'secondary'}
                      variant={step.type === 'search' ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                ))}
              </Box>
              {results.lineage.expandedIPs.length > 0 && (
                <Box sx={{ mt: 1.5, pl: 1, borderLeft: '2px solid', borderColor: 'secondary.main' }}>
                  <Typography variant="caption" color="text.secondary">
                    Expanded to include {results.lineage.expandedIPs.length} additional IP(s) from user history:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {results.lineage.expandedIPs.map(ip => (
                      <Chip
                        key={ip}
                        label={m.ip(ip)}
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={hasFullAccess ? () => { setSearchType('ip'); setSearchValue(ip); } : undefined}
                        sx={{ fontFamily: 'monospace', fontSize: '0.65rem', cursor: hasFullAccess ? 'pointer' : 'default' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}

          {/* Identity Summary */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon /> Identity Summary
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {results.summary.userIds.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    Firebase Users:
                  </Typography>
                  {results.summary.userIds.map(id => (
                    <Chip
                      key={id}
                      label={isReadOnly ? m.id(id) : (id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-8)}` : id)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={hasFullAccess ? () => { setSearchType('userId'); setSearchValue(id); } : undefined}
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: hasFullAccess ? 'pointer' : 'default' }}
                    />
                  ))}
                </Box>
              )}

              {results.summary.visitorIds.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    Visitor IDs:
                  </Typography>
                  {results.summary.visitorIds.slice(0, 5).map(id => (
                    <Chip
                      key={id}
                      label={isReadOnly ? m.id(id) : (id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-8)}` : id)}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onClick={hasFullAccess ? () => { setSearchType('visitorId'); setSearchValue(id); } : undefined}
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: hasFullAccess ? 'pointer' : 'default' }}
                    />
                  ))}
                  {results.summary.visitorIds.length > 5 && (
                    <Typography variant="caption" color="text.secondary">
                      +{results.summary.visitorIds.length - 5} more
                    </Typography>
                  )}
                </Box>
              )}

              {results.summary.ips.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    IP Addresses:
                  </Typography>
                  {results.summary.ips.map(ip => (
                    <Chip
                      key={ip}
                      label={m.ip(ip)}
                      size="small"
                      variant="outlined"
                      onClick={hasFullAccess ? () => { setSearchType('ip'); setSearchValue(ip); } : undefined}
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: hasFullAccess ? 'pointer' : 'default' }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography variant="body2">
                <strong>{results.summary.loginCount}</strong> login events
              </Typography>
              <Typography variant="body2">
                <strong>{results.summary.visitCount}</strong> visitor events
              </Typography>
              <Typography variant="body2">
                <strong>{results.timeline.length}</strong> total in timeline
              </Typography>
            </Box>
          </Paper>

          {/* User Details Accordion */}
          {(userDetails || detailsLoading) && (
            <Accordion sx={{ mb: 2 }} defaultExpanded={false}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon /> User Details
                  {detailsLoading && <CircularProgress size={16} sx={{ ml: 1 }} />}
                  {userDetails && !detailsLoading && (
                    <Chip
                      label={`${userDetails.users.length} user(s), ${userDetails.organizers.length} organizer(s)`}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {detailsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : userDetails && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Firebase / UserLogin Info */}
                    {userDetails.users.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                          Firebase / Login Info
                        </Typography>
                        <Grid container spacing={2}>
                          {userDetails.users.map((user, idx) => (
                            <Grid item xs={12} md={6} key={user.firebaseUserId || idx}>
                              <Paper variant="outlined" sx={{ p: 1.5 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Name</Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                      {user.firstName || user.lastName
                                        ? m.name(`${user.firstName || ''} ${user.lastName || ''}`.trim())
                                        : '-'}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Email</Typography>
                                    <Typography variant="body2">{m.email(user.email)}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Username</Typography>
                                    <Typography variant="body2">{m.username(user.userName)}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Firebase ID</Typography>
                                    <Tooltip title={hasFullAccess ? (user.firebaseUserId || '') : 'Masked'} arrow>
                                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                        {isReadOnly ? m.id(user.firebaseUserId) : (user.firebaseUserId ? `${user.firebaseUserId.slice(0, 8)}...${user.firebaseUserId.slice(-8)}` : '-')}
                                      </Typography>
                                    </Tooltip>
                                  </Box>
                                  {user.roles && user.roles.length > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <Typography variant="caption" color="text.secondary">Roles</Typography>
                                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {user.roles.map((role, i) => (
                                          <Chip key={i} label={role.shortName || role.name || role} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {/* Organizer Info */}
                    {userDetails.organizers.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="secondary" sx={{ mb: 1 }}>
                          Organizer Info
                        </Typography>
                        <Grid container spacing={2}>
                          {userDetails.organizers.map((org, idx) => (
                            <Grid item xs={12} md={6} key={org._id || idx}>
                              <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'secondary.main' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Full Name</Typography>
                                    <Typography variant="body2" fontWeight="medium">{m.name(org.fullName)}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Short Name</Typography>
                                    <Typography variant="body2">{m.name(org.shortName)}</Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">Types</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      {org.organizerTypes?.map((type, i) => (
                                        <Chip key={i} label={type} size="small" color="secondary" sx={{ fontSize: '0.65rem', height: 18 }} />
                                      )) || '-'}
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <Chip label={org.isActive ? 'Active' : 'Inactive'} size="small" color={org.isActive ? 'success' : 'default'} sx={{ fontSize: '0.6rem', height: 16 }} />
                                      <Chip label={org.isVisible ? 'Visible' : 'Hidden'} size="small" color={org.isVisible ? 'info' : 'default'} sx={{ fontSize: '0.6rem', height: 16 }} />
                                    </Box>
                                  </Box>
                                  {org.publicContactInfo?.email && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="caption" color="text.secondary">Contact Email</Typography>
                                      <Typography variant="body2">{m.email(org.publicContactInfo.email)}</Typography>
                                    </Box>
                                  )}
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {userDetails.users.length === 0 && userDetails.organizers.length === 0 && (
                      <Typography color="text.secondary" textAlign="center">
                        No user or organizer records found for the identified Firebase users.
                      </Typography>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* Activity Timeline */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Activity Timeline
            </Typography>

            {results.timeline.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={3}>
                No activity found for this search.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.timeline.map((item, i) => (
                    <TableRow key={`${item.type}-${item.id}-${i}`} hover>
                      <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                        {item.timestamp ? format(new Date(item.timestamp), 'MMM d, h:mm a') : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={item.type === 'login' ? <LoginIcon sx={{ fontSize: 14 }} /> : <VisibilityIcon sx={{ fontSize: 14 }} />}
                          label={item.type === 'login' ? 'Login' : 'Visit'}
                          size="small"
                          color={item.type === 'login' ? 'primary' : 'default'}
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {m.ip(item.ip)}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Tooltip title={hasFullAccess ? `${item.location?.latitude?.toFixed(4) || '-'}, ${item.location?.longitude?.toFixed(4) || '-'}` : 'Location masked'} arrow>
                          <span>
                            {[item.location?.city || item.location?.ipLookup?.city,
                              item.location?.region || item.location?.ipLookup?.region].filter(Boolean).join(', ') || '-'}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.deviceType || 'unknown'}
                          size="small"
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {item.type === 'login' ? (
                          <Tooltip title={hasFullAccess ? (item.firebaseUserId || '') : 'Masked'} arrow>
                            <span>User: {isReadOnly ? m.id(item.firebaseUserId) : (item.firebaseUserId?.slice(-8) || '-')}</span>
                          </Tooltip>
                        ) : (
                          <>
                            {item.page && <span>Page: {item.page}</span>}
                            {!item.page && item.visitorId && (
                              <Tooltip title={hasFullAccess ? item.visitorId : 'Masked'} arrow>
                                <span>Visitor: {isReadOnly ? m.id(item.visitorId) : item.visitorId?.slice(-8)}</span>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      )}

      {/* Empty State */}
      {!results && !loading && !error && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Enter a search to view activity
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Search by IP address, Firebase User ID, or Visitor ID to see all related login and visitor activity.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
