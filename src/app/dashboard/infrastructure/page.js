'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Link,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import BugReportIcon from '@mui/icons-material/BugReport';

// GitHub repos to monitor
const GITHUB_REPOS = [
  { owner: 'ybotman', repo: 'tangotiempo.com', name: 'TangoTiempo Frontend' },
  { owner: 'ybotman', repo: 'calendar-be-af', name: 'Calendar Backend (AF)' },
  { owner: 'ybotman', repo: 'calops', name: 'CalOps Admin' },
];

// Vercel deployments to monitor
const VERCEL_DEPLOYMENTS = [
  { name: 'TangoTiempo', prodUrl: 'tangotiempo.com', testUrl: 'tangotiempo-test.vercel.app', project: 'tangotiempo' },
  { name: 'CalOps', prodUrl: 'calops.vercel.app', testUrl: 'calops-test.vercel.app', project: 'calops' },
];

// Time range options for error queries
const TIME_RANGES = [
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '12h', label: 'Last 12 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
];

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

// Status code chip with appropriate color
function StatusCodeChip({ code }) {
  const codeStr = String(code);
  let color = 'default';
  let icon = null;

  if (codeStr.startsWith('4')) {
    color = 'warning';
    icon = <WarningIcon fontSize="small" />;
  } else if (codeStr.startsWith('5')) {
    color = 'error';
    icon = <ErrorIcon fontSize="small" />;
  }

  return (
    <Chip
      label={code}
      size="small"
      color={color}
      icon={icon}
      sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}
    />
  );
}

export default function InfrastructurePage() {
  const [tabValue, setTabValue] = useState(0);
  const [gitData, setGitData] = useState({});
  const [gitLoading, setGitLoading] = useState(true);
  const [gitError, setGitError] = useState(null);
  const [vercelStatus, setVercelStatus] = useState({});
  const [vercelLoading, setVercelLoading] = useState(true);

  // API Errors state
  const [errorTimeRange, setErrorTimeRange] = useState('24h');
  const [errorSummary, setErrorSummary] = useState({ rows: [], loading: true, error: null });
  const [errorsByEndpoint, setErrorsByEndpoint] = useState({ rows: [], loading: true, error: null });
  const [recentErrors, setRecentErrors] = useState({ rows: [], loading: true, error: null });

  // Fetch GitHub repo data
  const fetchGitData = useCallback(async () => {
    setGitLoading(true);
    setGitError(null);

    const results = {};

    for (const { owner, repo, name } of GITHUB_REPOS) {
      try {
        // Fetch recent commits
        const commitsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`
        );
        const commits = await commitsRes.json();

        // Fetch branches
        const branchesRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/branches`
        );
        const branches = await branchesRes.json();

        // Get package.json for version (if exists)
        let version = null;
        try {
          const pkgRes = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`
          );
          if (pkgRes.ok) {
            const pkg = await pkgRes.json();
            version = pkg.version;
          }
        } catch (e) {
          // No package.json or error
        }

        results[repo] = {
          name,
          commits: Array.isArray(commits) ? commits : [],
          branches: Array.isArray(branches) ? branches : [],
          version,
          error: null
        };
      } catch (error) {
        results[repo] = {
          name,
          commits: [],
          branches: [],
          version: null,
          error: error.message
        };
      }
    }

    setGitData(results);
    setGitLoading(false);
  }, []);

  // Check Vercel deployment status (simple ping)
  const checkVercelStatus = useCallback(async () => {
    setVercelLoading(true);
    const results = {};

    for (const deployment of VERCEL_DEPLOYMENTS) {
      results[deployment.project] = {
        prod: { status: 'checking', url: deployment.prodUrl },
        test: { status: 'checking', url: deployment.testUrl }
      };

      // Check prod
      try {
        const prodRes = await fetch(`https://${deployment.prodUrl}`, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        results[deployment.project].prod.status = 'up';
      } catch (e) {
        results[deployment.project].prod.status = 'error';
      }

      // Check test
      try {
        const testRes = await fetch(`https://${deployment.testUrl}`, {
          method: 'HEAD',
          mode: 'no-cors'
        });
        results[deployment.project].test.status = 'up';
      } catch (e) {
        results[deployment.project].test.status = 'error';
      }
    }

    setVercelStatus(results);
    setVercelLoading(false);
  }, []);

  // Fetch App Insights error data
  const fetchErrorData = useCallback(async (timeRange) => {
    // Fetch error summary
    setErrorSummary(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/appinsights?query=errorSummary&timeRange=${timeRange}`);
      const data = await res.json();
      if (data.success) {
        setErrorSummary({ rows: data.rows || [], loading: false, error: null });
      } else {
        setErrorSummary({ rows: [], loading: false, error: data.error || 'Failed to fetch' });
      }
    } catch (e) {
      setErrorSummary({ rows: [], loading: false, error: e.message });
    }

    // Fetch errors by endpoint
    setErrorsByEndpoint(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/appinsights?query=errorsByEndpoint&timeRange=${timeRange}`);
      const data = await res.json();
      if (data.success) {
        setErrorsByEndpoint({ rows: data.rows || [], loading: false, error: null });
      } else {
        setErrorsByEndpoint({ rows: [], loading: false, error: data.error || 'Failed to fetch' });
      }
    } catch (e) {
      setErrorsByEndpoint({ rows: [], loading: false, error: e.message });
    }

    // Fetch recent errors
    setRecentErrors(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`/api/appinsights?query=recentErrors&timeRange=${timeRange}`);
      const data = await res.json();
      if (data.success) {
        setRecentErrors({ rows: data.rows || [], loading: false, error: null });
      } else {
        setRecentErrors({ rows: [], loading: false, error: data.error || 'Failed to fetch' });
      }
    } catch (e) {
      setRecentErrors({ rows: [], loading: false, error: e.message });
    }
  }, []);

  useEffect(() => {
    fetchGitData();
    checkVercelStatus();
  }, [fetchGitData, checkVercelStatus]);

  // Fetch error data when tab changes to API Errors or time range changes
  useEffect(() => {
    if (tabValue === 2) {
      fetchErrorData(errorTimeRange);
    }
  }, [tabValue, errorTimeRange, fetchErrorData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'up':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <ScheduleIcon color="disabled" fontSize="small" />;
    }
  };

  // Extract endpoint name from full path
  const getEndpointName = (name) => {
    if (!name) return '-';
    // Remove common prefixes
    return name.replace(/^(GET|POST|PUT|DELETE|PATCH)\s+/, '');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Infrastructure Status</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchGitData();
            checkVercelStatus();
            if (tabValue === 2) fetchErrorData(errorTimeRange);
          }}
          disabled={gitLoading || vercelLoading}
        >
          Refresh All
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<GitHubIcon />} label="Git Repos" iconPosition="start" />
          <Tab label="Vercel Deployments" iconPosition="start" />
          <Tab icon={<BugReportIcon />} label="API Errors" iconPosition="start" />
        </Tabs>

        {/* Git Repos Tab */}
        <TabPanel value={tabValue} index={0}>
          {gitLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {gitError && <Alert severity="error" sx={{ m: 2 }}>{gitError}</Alert>}

          {!gitLoading && (
            <Grid container spacing={2} sx={{ p: 2 }}>
              {GITHUB_REPOS.map(({ repo, name }) => {
                const data = gitData[repo] || {};
                return (
                  <Grid item xs={12} key={repo}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GitHubIcon />
                            <Typography variant="h6">{name}</Typography>
                            {data.version && (
                              <Chip label={`v${data.version}`} size="small" color="primary" />
                            )}
                          </Box>
                          <Tooltip title="Open on GitHub">
                            <IconButton
                              component={Link}
                              href={`https://github.com/ybotman/${repo}`}
                              target="_blank"
                              size="small"
                            >
                              <OpenInNewIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>

                        {data.error && (
                          <Alert severity="error" sx={{ mb: 2 }}>{data.error}</Alert>
                        )}

                        {/* Branches */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Branches
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {(data.branches || []).slice(0, 6).map((branch) => (
                              <Chip
                                key={branch.name}
                                label={branch.name}
                                size="small"
                                variant={['main', 'PROD', 'TEST', 'DEVL'].includes(branch.name) ? 'filled' : 'outlined'}
                                color={branch.name === 'main' || branch.name === 'PROD' ? 'success' :
                                       branch.name === 'TEST' ? 'warning' :
                                       branch.name === 'DEVL' ? 'info' : 'default'}
                              />
                            ))}
                          </Box>
                        </Box>

                        {/* Recent Commits */}
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Recent Commits
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Message</TableCell>
                                <TableCell>Author</TableCell>
                                <TableCell>SHA</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(data.commits || []).slice(0, 5).map((commit) => (
                                <TableRow key={commit.sha} hover>
                                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                    {formatDate(commit.commit?.author?.date)}
                                  </TableCell>
                                  <TableCell sx={{ maxWidth: 400 }}>
                                    <Typography variant="body2" noWrap>
                                      {commit.commit?.message?.split('\n')[0]}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {commit.commit?.author?.name?.split(' ')[0]}
                                  </TableCell>
                                  <TableCell>
                                    <Link
                                      href={`https://github.com/ybotman/${repo}/commit/${commit.sha}`}
                                      target="_blank"
                                      sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    >
                                      {commit.sha?.substring(0, 7)}
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* Vercel Deployments Tab */}
        <TabPanel value={tabValue} index={1}>
          {vercelLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!vercelLoading && (
            <Grid container spacing={2} sx={{ p: 2 }}>
              {VERCEL_DEPLOYMENTS.map((deployment) => {
                const status = vercelStatus[deployment.project] || {};
                return (
                  <Grid item xs={12} md={6} key={deployment.project}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>{deployment.name}</Typography>

                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Environment</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>URL</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell>
                                  <Chip label="PROD" size="small" color="success" />
                                </TableCell>
                                <TableCell>
                                  {getStatusIcon(status.prod?.status)}
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`https://${deployment.prodUrl}`}
                                    target="_blank"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                  >
                                    {deployment.prodUrl}
                                    <OpenInNewIcon fontSize="small" />
                                  </Link>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>
                                  <Chip label="TEST" size="small" color="warning" />
                                </TableCell>
                                <TableCell>
                                  {getStatusIcon(status.test?.status)}
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`https://${deployment.testUrl}`}
                                    target="_blank"
                                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                  >
                                    {deployment.testUrl}
                                    <OpenInNewIcon fontSize="small" />
                                  </Link>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>

                        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            component={Link}
                            href={`https://vercel.com/ybotman/${deployment.project}`}
                            target="_blank"
                          >
                            Vercel Dashboard
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* API Errors Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            {/* Time Range Selector */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Azure Functions API Errors</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={errorTimeRange}
                    label="Time Range"
                    onChange={(e) => setErrorTimeRange(e.target.value)}
                  >
                    {TIME_RANGES.map(({ value, label }) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchErrorData(errorTimeRange)}
                  disabled={errorSummary.loading}
                >
                  Refresh
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Error Summary Card */}
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Error Summary
                    </Typography>
                    {errorSummary.loading && <CircularProgress size={24} />}
                    {errorSummary.error && (
                      <Alert severity="error" sx={{ mb: 1 }}>{errorSummary.error}</Alert>
                    )}
                    {!errorSummary.loading && !errorSummary.error && (
                      <>
                        {errorSummary.rows.length === 0 ? (
                          <Alert severity="success">No errors in this time range</Alert>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {errorSummary.rows.map((row, i) => (
                              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <StatusCodeChip code={row.resultCode} />
                                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                                  {row.count_}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Errors by Endpoint Card */}
              <Grid item xs={12} md={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Top Failing Endpoints
                    </Typography>
                    {errorsByEndpoint.loading && <CircularProgress size={24} />}
                    {errorsByEndpoint.error && (
                      <Alert severity="error" sx={{ mb: 1 }}>{errorsByEndpoint.error}</Alert>
                    )}
                    {!errorsByEndpoint.loading && !errorsByEndpoint.error && (
                      <TableContainer sx={{ maxHeight: 300 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Endpoint</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell align="right">Count</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {errorsByEndpoint.rows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} align="center">
                                  No errors
                                </TableCell>
                              </TableRow>
                            ) : (
                              errorsByEndpoint.rows.slice(0, 15).map((row, i) => (
                                <TableRow key={i} hover>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {getEndpointName(row.name)}
                                  </TableCell>
                                  <TableCell>
                                    <StatusCodeChip code={row.resultCode} />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                      {row.count_}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Errors Table */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Recent Errors
                    </Typography>
                    {recentErrors.loading && <CircularProgress size={24} />}
                    {recentErrors.error && (
                      <Alert severity="error" sx={{ mb: 1 }}>{recentErrors.error}</Alert>
                    )}
                    {!recentErrors.loading && !recentErrors.error && (
                      <TableContainer sx={{ maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Timestamp</TableCell>
                              <TableCell>Endpoint</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Duration</TableCell>
                              <TableCell>Location</TableCell>
                              <TableCell>Operation ID</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {recentErrors.rows.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} align="center">
                                  No recent errors
                                </TableCell>
                              </TableRow>
                            ) : (
                              recentErrors.rows.map((row, i) => (
                                <TableRow key={i} hover>
                                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                    {formatTimestamp(row.timestamp)}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', maxWidth: 250 }}>
                                    <Tooltip title={row.url || ''}>
                                      <span>{getEndpointName(row.name)}</span>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell>
                                    <StatusCodeChip code={row.resultCode} />
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {row.duration ? `${Math.round(row.duration)}ms` : '-'}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.8rem' }}>
                                    {row.client_City && row.client_CountryOrRegion
                                      ? `${row.client_City}, ${row.client_CountryOrRegion}`
                                      : row.client_CountryOrRegion || '-'}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                    <Tooltip title="Copy Operation ID">
                                      <span
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigator.clipboard.writeText(row.operation_Id)}
                                      >
                                        {row.operation_Id?.substring(0, 8)}...
                                      </span>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
