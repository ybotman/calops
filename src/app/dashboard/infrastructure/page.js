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
  CardContent
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';

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

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
}

export default function InfrastructurePage() {
  const [tabValue, setTabValue] = useState(0);
  const [gitData, setGitData] = useState({});
  const [gitLoading, setGitLoading] = useState(true);
  const [gitError, setGitError] = useState(null);
  const [vercelStatus, setVercelStatus] = useState({});
  const [vercelLoading, setVercelLoading] = useState(true);

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

  useEffect(() => {
    fetchGitData();
    checkVercelStatus();
  }, [fetchGitData, checkVercelStatus]);

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Infrastructure Status</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => { fetchGitData(); checkVercelStatus(); }}
          disabled={gitLoading || vercelLoading}
        >
          Refresh All
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab icon={<GitHubIcon />} label="Git Repos" iconPosition="start" />
          <Tab label="Vercel Deployments" iconPosition="start" />
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
      </Paper>
    </Box>
  );
}
