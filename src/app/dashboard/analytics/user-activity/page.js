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
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { format } from 'date-fns';

/**
 * User Activity Lookup Page
 * Search by userId, IP, or visitorId to see all related activity
 * Cross-references login history and visitor history via IP
 */
export default function UserActivityPage() {
  const [searchType, setSearchType] = useState('ip');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

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

  // Main search handler
  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let logins = [];
      let visits = [];
      let identifiedIPs = new Set();
      let identifiedUserIds = new Set();
      let identifiedVisitorIds = new Set();

      if (searchType === 'userId') {
        // Search by Firebase User ID
        logins = await fetchLoginHistory({ firebaseUserId: searchValue.trim() });

        // Extract unique IPs from login records
        logins.forEach(l => {
          if (l.ip) identifiedIPs.add(l.ip);
          if (l.firebaseUserId) identifiedUserIds.add(l.firebaseUserId);
        });

        // Cross-reference: find visitor activity from same IPs
        for (const ip of identifiedIPs) {
          const ipVisits = await fetchVisitorHistory({ ip });
          ipVisits.forEach(v => {
            visits.push(v);
            if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
          });
        }

      } else if (searchType === 'ip') {
        // Search by IP - get both logins and visits
        logins = await fetchLoginHistory({ ip: searchValue.trim() });
        visits = await fetchVisitorHistory({ ip: searchValue.trim() });

        identifiedIPs.add(searchValue.trim());
        logins.forEach(l => {
          if (l.firebaseUserId) identifiedUserIds.add(l.firebaseUserId);
        });
        visits.forEach(v => {
          if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
        });

      } else if (searchType === 'visitorId') {
        // Search by Visitor ID
        visits = await fetchVisitorHistory({ visitorId: searchValue.trim() });

        // Extract unique IPs from visitor records
        visits.forEach(v => {
          if (v.ip) identifiedIPs.add(v.ip);
          if (v.visitorId) identifiedVisitorIds.add(v.visitorId);
        });

        // Cross-reference: find login activity from same IPs
        for (const ip of identifiedIPs) {
          const ipLogins = await fetchLoginHistory({ ip });
          ipLogins.forEach(l => {
            logins.push(l);
            if (l.firebaseUserId) identifiedUserIds.add(l.firebaseUserId);
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

      setResults({
        timeline: dedupedTimeline,
        summary: {
          userIds: Array.from(identifiedUserIds),
          visitorIds: Array.from(identifiedVisitorIds),
          ips: Array.from(identifiedIPs),
          loginCount: logins.length,
          visitCount: visits.length
        }
      });

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
      <Typography variant="h4" sx={{ mb: 3 }}>User Activity Lookup</Typography>

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
                      label={id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-8)}` : id}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onClick={() => { setSearchType('userId'); setSearchValue(id); }}
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
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
                      label={id.length > 16 ? `${id.slice(0, 8)}...${id.slice(-8)}` : id}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      onClick={() => { setSearchType('visitorId'); setSearchValue(id); }}
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
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
                      label={ip}
                      size="small"
                      variant="outlined"
                      onClick={() => { setSearchType('ip'); setSearchValue(ip); }}
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
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
                        {item.ip || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Tooltip title={`${item.location?.latitude?.toFixed(4) || '-'}, ${item.location?.longitude?.toFixed(4) || '-'}`} arrow>
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
                          <Tooltip title={item.firebaseUserId || ''} arrow>
                            <span>User: {item.firebaseUserId?.slice(-8) || '-'}</span>
                          </Tooltip>
                        ) : (
                          <>
                            {item.page && <span>Page: {item.page}</span>}
                            {!item.page && item.visitorId && (
                              <Tooltip title={item.visitorId} arrow>
                                <span>Visitor: {item.visitorId?.slice(-8)}</span>
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
