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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TablePagination,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Collapse,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useAppContext } from '@/lib/AppContext';

/**
 * Event Activity Analytics Page
 * Audit trail of event CRUD operations (CREATE, UPDATE, DELETE)
 */
export default function EventActivityPage() {
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Filters
  const [timeRange, setTimeRange] = useState('7D');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [eventIdFilter, setEventIdFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(0); // MUI uses 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Expanded rows for showing changes
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('appId', appId);
      params.append('range', timeRange);
      params.append('limit', rowsPerPage.toString());
      params.append('page', (page + 1).toString()); // API uses 1-indexed
      params.append('sort', 'desc');

      if (actionFilter) params.append('action', actionFilter);
      if (roleFilter) params.append('roleName', roleFilter);
      if (userFilter) params.append('firebaseUserId', userFilter);
      if (eventIdFilter) params.append('eventId', eventIdFilter);

      params.append('_t', Date.now().toString());

      const response = await axios.get(`/api/analytics/event-activity?${params.toString()}`);
      const result = response.data;

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Invalid response');
      }
    } catch (err) {
      console.error('Error fetching event activity:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [appId, timeRange, actionFilter, roleFilter, userFilter, eventIdFilter, page, rowsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRowExpanded = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return <AddIcon fontSize="small" />;
      case 'UPDATE': return <EditIcon fontSize="small" />;
      case 'DELETE': return <DeleteIcon fontSize="small" />;
      default: return null;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'info';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderChanges = (activity) => {
    if (activity.action === 'CREATE') {
      return (
        <Box sx={{ p: 1, bgcolor: 'success.light', borderRadius: 1, opacity: 0.8 }}>
          <Typography variant="caption" color="success.contrastText">
            New event created
          </Typography>
        </Box>
      );
    }

    if (activity.action === 'DELETE') {
      return (
        <Box sx={{ p: 1, bgcolor: 'error.light', borderRadius: 1, opacity: 0.8 }}>
          <Typography variant="caption" color="error.contrastText">
            Event deleted
          </Typography>
          {activity.deletedSnapshot && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Title: {activity.deletedSnapshot.title || 'N/A'}
            </Typography>
          )}
        </Box>
      );
    }

    if (activity.action === 'UPDATE' && activity.changes) {
      const { before, after } = activity.changes;
      if (!before && !after) return <Typography variant="caption">No changes recorded</Typography>;

      const changedFields = new Set([
        ...Object.keys(before || {}),
        ...Object.keys(after || {})
      ]);

      return (
        <Box sx={{ fontSize: '0.75rem' }}>
          {Array.from(changedFields).map(field => (
            <Box key={field} sx={{ mb: 0.5 }}>
              <Typography variant="caption" fontWeight="bold">{field}:</Typography>
              <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
                <Chip
                  size="small"
                  label={JSON.stringify(before?.[field]) || 'null'}
                  sx={{ bgcolor: 'error.light', fontSize: '0.65rem', height: 20 }}
                />
                <Typography variant="caption">→</Typography>
                <Chip
                  size="small"
                  label={JSON.stringify(after?.[field]) || 'null'}
                  sx={{ bgcolor: 'success.light', fontSize: '0.65rem', height: 20 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      );
    }

    return null;
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
          Event Activity Audit Trail
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Time Range */}
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, v) => v && setTimeRange(v)}
            size="small"
          >
            <ToggleButton value="1H">1H</ToggleButton>
            <ToggleButton value="1D">1D</ToggleButton>
            <ToggleButton value="7D">7D</ToggleButton>
            <ToggleButton value="1M">1M</ToggleButton>
            <ToggleButton value="3M">3M</ToggleButton>
            <ToggleButton value="All">All</ToggleButton>
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

      {/* Filters Row */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={actionFilter}
                label="Action"
                onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="CREATE">Create</MenuItem>
                <MenuItem value="UPDATE">Update</MenuItem>
                <MenuItem value="DELETE">Delete</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="SiteAdmin">Site Admin</MenuItem>
                <MenuItem value="RegionalAdmin">Regional Admin</MenuItem>
                <MenuItem value="RegionalOrganizer">Regional Organizer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="User ID"
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
              placeholder="Firebase User ID"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Event ID"
              value={eventIdFilter}
              onChange={(e) => { setEventIdFilter(e.target.value); setPage(0); }}
              placeholder="MongoDB Event ID"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setActionFilter('');
                setRoleFilter('');
                setUserFilter('');
                setEventIdFilter('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #1976d2' }}>
                <Typography variant="h5">{data.summary?.totalActivities?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #2e7d32' }}>
                <Typography variant="h5">{data.summary?.creates?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Creates</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #0288d1' }}>
                <Typography variant="h5">{data.summary?.updates?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Updates</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #d32f2f' }}>
                <Typography variant="h5">{data.summary?.deletes?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Deletes</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #7b1fa2' }}>
                <Typography variant="h5">{data.summary?.uniqueUserCount?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Users</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #f57c00' }}>
                <Typography variant="h5">{data.summary?.uniqueEventCount?.toLocaleString() || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Events</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Activities Table */}
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width={40}></TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Event ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.activities || []).map((activity) => (
                    <>
                      <TableRow
                        key={activity._id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => toggleRowExpanded(activity._id)}
                      >
                        <TableCell>
                          <IconButton size="small">
                            {expandedRows.has(activity._id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{formatTimestamp(activity.timestamp)}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getActionIcon(activity.action)}
                            label={activity.action}
                            color={getActionColor(activity.action)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={activity.firebaseUserId || ''}>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {activity.userEmail || activity.firebaseUserId?.substring(0, 8) + '...' || '-'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip label={activity.roleName || 'Unknown'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">
                            {activity.eventId?.substring(0, 12)}...
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={6} sx={{ py: 0 }}>
                          <Collapse in={expandedRows.has(activity._id)} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                              <Typography variant="subtitle2" gutterBottom>Changes:</Typography>
                              {renderChanges(activity)}
                              {activity.endpoint && (
                                <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                                  Endpoint: {activity.endpoint}
                                </Typography>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </>
                  ))}
                  {(!data.activities || data.activities.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">No activity found for selected filters</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data.pagination?.total || 0}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </Paper>
        </>
      )}
    </Box>
  );
}
