'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import GitHubIcon from '@mui/icons-material/GitHub';
import AddIcon from '@mui/icons-material/Add';

// Repository configuration - TANGOTIEMPO first, then BE-AF, then CALOPS
const REPOS = [
  {
    name: 'TANGOTIEMPO',
    owner: 'ybotman',
    repo: 'TangoTiempo.com',
    branches: { dev: 'DEVL', test: 'TEST', prod: 'PROD' },
    color: '#ff9800',
    deployUrls: {
      test: 'https://test.tangotiempo.com/api/health/version',
      prod: 'https://www.tangotiempo.com/api/health/version'
    }
  },
  {
    name: 'CALENDAR-BE-AF',
    label: 'Primary',
    owner: 'ybotman',
    repo: 'calendar-be-af',
    branches: { dev: 'DEVL', test: 'TEST', prod: 'PROD' },
    color: '#4caf50',
    deployUrls: {
      test: 'https://calendarbeaf-test.azurewebsites.net/api/health/version',
      prod: 'https://calendarbeaf-prod.azurewebsites.net/api/health/version'
    }
  },
  {
    name: 'CALENDAR-BE-AF-2',
    label: 'Failover',
    owner: 'ybotman',
    repo: 'calendar-be-af',
    branches: { dev: 'DEVL', test: 'TEST', prod: 'PROD' },
    color: '#81c784',
    deployUrls: {
      test: 'https://calendarbeaf-test-2.azurewebsites.net/api/health/version',
      prod: 'https://calendarbeaf-prod-2.azurewebsites.net/api/health/version'
    },
    isFailover: true
  },
  {
    name: 'CALOPS',
    owner: 'ybotman',
    repo: 'calops',
    branches: { dev: 'DEVL', test: 'TEST', prod: 'PROD' },
    color: '#2196f3',
    deployUrls: {
      test: 'https://calops-test.vercel.app/api/health/version',
      prod: 'https://www.cal-ops.org/api/health/version'
    }
  }
];

const GITHUB_API = 'https://api.github.com';
const DEFAULT_COMMITS = 10;
const MORE_COMMITS = 25;

export default function GitPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [repoData, setRepoData] = useState([]);
  const [deployedVersions, setDeployedVersions] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [commitCounts, setCommitCounts] = useState({});
  const [loadingMore, setLoadingMore] = useState({});

  // Fetch deployed version from health endpoint
  const fetchDeployedVersion = useCallback(async (url) => {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return data.version || null;
      }
    } catch {
      // Health endpoint not available
    }
    return null;
  }, []);

  // Fetch all deployed versions
  const fetchAllDeployedVersions = useCallback(async () => {
    const versions = {};

    await Promise.all(
      REPOS.map(async (repo) => {
        if (!repo.deployUrls) return;

        versions[repo.name] = {};

        // Fetch TEST deployed version
        if (repo.deployUrls.test) {
          versions[repo.name].test = await fetchDeployedVersion(repo.deployUrls.test);
        }

        // Fetch PROD deployed version
        if (repo.deployUrls.prod) {
          versions[repo.name].prod = await fetchDeployedVersion(repo.deployUrls.prod);
        }
      })
    );

    setDeployedVersions(versions);
  }, [fetchDeployedVersion]);

  const fetchBranchData = useCallback(async (repoConfig, perPage = DEFAULT_COMMITS) => {
    const { owner, repo, branches } = repoConfig;
    const branchData = {};

    for (const [env, branchName] of Object.entries(branches)) {
      try {
        // Get branch info
        const branchRes = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/branches/${branchName}`
        );

        if (!branchRes.ok) {
          branchData[env] = { error: `Branch ${branchName} not found` };
          continue;
        }

        const branch = await branchRes.json();

        // Get recent commits for this branch
        const commitsRes = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${branchName}&per_page=${perPage}`
        );
        const commits = commitsRes.ok ? await commitsRes.json() : [];

        // Try to get package.json for version
        let version = null;
        try {
          const pkgRes = await fetch(
            `https://raw.githubusercontent.com/${owner}/${repo}/${branchName}/package.json`
          );
          if (pkgRes.ok) {
            const pkg = await pkgRes.json();
            version = pkg.version;
          }
        } catch {
          // No package.json or error
        }

        branchData[env] = {
          name: branchName,
          sha: branch.commit.sha.substring(0, 7),
          fullSha: branch.commit.sha,
          message: branch.commit.commit.message.split('\n')[0].substring(0, 60),
          author: branch.commit.commit.author.name,
          date: branch.commit.commit.author.date,
          version,
          commits: commits.map(c => ({
            sha: c.sha.substring(0, 7),
            message: c.commit.message.split('\n')[0].substring(0, 70),
            author: c.commit.author.name,
            date: c.commit.author.date
          }))
        };
      } catch (err) {
        branchData[env] = { error: err.message };
      }
    }

    return branchData;
  }, []);

  const compareBranches = useCallback(async (repoConfig, branchData) => {
    const { owner, repo } = repoConfig;
    const comparisons = {};

    // Compare dev -> test
    if (branchData.dev?.fullSha && branchData.test?.fullSha) {
      try {
        const res = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/compare/${branchData.test.fullSha}...${branchData.dev.fullSha}`
        );
        if (res.ok) {
          const data = await res.json();
          comparisons.devToTest = {
            ahead: data.ahead_by,
            behind: data.behind_by,
            status: data.status
          };
        }
      } catch {
        comparisons.devToTest = { error: true };
      }
    }

    // Compare test -> prod
    if (branchData.test?.fullSha && branchData.prod?.fullSha) {
      try {
        const res = await fetch(
          `${GITHUB_API}/repos/${owner}/${repo}/compare/${branchData.prod.fullSha}...${branchData.test.fullSha}`
        );
        if (res.ok) {
          const data = await res.json();
          comparisons.testToProd = {
            ahead: data.ahead_by,
            behind: data.behind_by,
            status: data.status
          };
        }
      } catch {
        comparisons.testToProd = { error: true };
      }
    }

    return comparisons;
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch git data and deployed versions in parallel
      const [results] = await Promise.all([
        Promise.all(
          REPOS.map(async (repoConfig) => {
            const branchData = await fetchBranchData(repoConfig);
            const comparisons = await compareBranches(repoConfig, branchData);

            return {
              ...repoConfig,
              branches: branchData,
              comparisons
            };
          })
        ),
        fetchAllDeployedVersions()
      ]);

      setRepoData(results);
      setLastUpdated(new Date());

      // Initialize commit counts
      const counts = {};
      results.forEach(repo => {
        counts[repo.name] = { dev: DEFAULT_COMMITS, test: DEFAULT_COMMITS, prod: DEFAULT_COMMITS };
      });
      setCommitCounts(counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchBranchData, compareBranches, fetchAllDeployedVersions]);

  const fetchMoreCommits = useCallback(async (repoName, env) => {
    const loadingKey = `${repoName}-${env}`;
    setLoadingMore(prev => ({ ...prev, [loadingKey]: true }));

    try {
      const repoConfig = REPOS.find(r => r.name === repoName);
      if (!repoConfig) return;

      const { owner, repo, branches } = repoConfig;
      const branchName = branches[env];
      const newCount = (commitCounts[repoName]?.[env] || DEFAULT_COMMITS) + MORE_COMMITS;

      const commitsRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/commits?sha=${branchName}&per_page=${newCount}`
      );

      if (commitsRes.ok) {
        const commits = await commitsRes.json();

        setRepoData(prev => prev.map(r => {
          if (r.name === repoName) {
            return {
              ...r,
              branches: {
                ...r.branches,
                [env]: {
                  ...r.branches[env],
                  commits: commits.map(c => ({
                    sha: c.sha.substring(0, 7),
                    message: c.commit.message.split('\n')[0].substring(0, 70),
                    author: c.commit.author.name,
                    date: c.commit.author.date
                  }))
                }
              }
            };
          }
          return r;
        }));

        setCommitCounts(prev => ({
          ...prev,
          [repoName]: {
            ...prev[repoName],
            [env]: newCount
          }
        }));
      }
    } catch (err) {
      console.error('Error fetching more commits:', err);
    } finally {
      setLoadingMore(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [commitCounts]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getPipelineStatus = (comparisons) => {
    const devToTest = comparisons?.devToTest?.ahead || 0;
    const testToProd = comparisons?.testToProd?.ahead || 0;

    if (devToTest === 0 && testToProd === 0) {
      return { status: 'synced', label: 'SYNCED', color: 'success' };
    }
    if (testToProd > 0) {
      return { status: 'pending-prod', label: `${testToProd} to PROD`, color: 'warning' };
    }
    if (devToTest > 0) {
      return { status: 'pending-test', label: `${devToTest} to TEST`, color: 'info' };
    }
    return { status: 'unknown', label: 'UNKNOWN', color: 'default' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box>
      <Paper sx={{ p: 0, mb: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GitHubIcon />
            <Typography variant="h6">Git Pipeline Status</Typography>
            {lastUpdated && (
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={fetchAllData}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            sx={{ bgcolor: 'primary.light' }}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {loading && repoData.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                {/* Header row 1 - grouped headers */}
                <TableRow sx={{ bgcolor: 'grey.200' }}>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold', borderRight: '2px solid #ccc' }}>Project</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold', borderRight: '1px solid #ddd' }}>DEVL</TableCell>
                  <TableCell colSpan={2} align="center" sx={{ fontWeight: 'bold', borderRight: '2px solid #ccc', bgcolor: '#e3f2fd' }}>TEST</TableCell>
                  <TableCell colSpan={2} align="center" sx={{ fontWeight: 'bold', borderRight: '2px solid #ccc', bgcolor: '#fff3e0' }}>PROD</TableCell>
                  <TableCell rowSpan={2} sx={{ fontWeight: 'bold' }}>Pipeline</TableCell>
                </TableRow>
                {/* Header row 2 - sub-headers */}
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', bgcolor: '#e3f2fd' }}>Git</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', borderRight: '2px solid #ccc', bgcolor: '#e3f2fd' }}>Deployed</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', bgcolor: '#fff3e0' }}>Git</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', borderRight: '2px solid #ccc', bgcolor: '#fff3e0' }}>Deployed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {repoData.map((repo) => {
                  const pipelineStatus = getPipelineStatus(repo.comparisons);
                  const deployed = deployedVersions[repo.name] || {};

                  return (
                    <TableRow key={repo.name} hover>
                      {/* Project name */}
                      <TableCell sx={{ borderRight: '2px solid #ccc' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: repo.color
                            }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {repo.name}
                            </Typography>
                            {repo.label && (
                              <Typography variant="caption" color="text.secondary">
                                {repo.label}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* DEVL - Git only (no deployed for localhost) */}
                      <TableCell sx={{ borderRight: '1px solid #ddd' }}>
                        {repo.branches.dev?.error ? (
                          <Chip label="Error" color="error" size="small" />
                        ) : (
                          <Tooltip title={`${repo.branches.dev?.message || ''}`}>
                            <Box>
                              {repo.branches.dev?.version && (
                                <Chip
                                  label={`v${repo.branches.dev.version}`}
                                  size="small"
                                  sx={{ mb: 0.5, fontWeight: 'bold' }}
                                />
                              )}
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                                {repo.branches.dev?.sha || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(repo.branches.dev?.date)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* TEST Git */}
                      <TableCell sx={{ bgcolor: '#fafafa' }}>
                        {repo.branches.test?.error ? (
                          <Chip label="Error" color="error" size="small" />
                        ) : (
                          <Tooltip title={`${repo.branches.test?.message || ''}`}>
                            <Box>
                              {repo.branches.test?.version && (
                                <Chip
                                  label={`v${repo.branches.test.version}`}
                                  size="small"
                                  sx={{ mb: 0.5, fontWeight: 'bold' }}
                                />
                              )}
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                                {repo.branches.test?.sha || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(repo.branches.test?.date)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* TEST Deployed */}
                      <TableCell sx={{ borderRight: '2px solid #ccc', bgcolor: '#fafafa' }}>
                        {deployed.test ? (
                          <Chip
                            label={`v${deployed.test}`}
                            size="small"
                            color={deployed.test === repo.branches.test?.version ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">N/A</Typography>
                        )}
                      </TableCell>

                      {/* PROD Git */}
                      <TableCell sx={{ bgcolor: '#fffbf5' }}>
                        {repo.branches.prod?.error ? (
                          <Chip label="Error" color="error" size="small" />
                        ) : (
                          <Tooltip title={`${repo.branches.prod?.message || ''}`}>
                            <Box>
                              {repo.branches.prod?.version && (
                                <Chip
                                  label={`v${repo.branches.prod.version}`}
                                  size="small"
                                  sx={{ mb: 0.5, fontWeight: 'bold' }}
                                />
                              )}
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>
                                {repo.branches.prod?.sha || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(repo.branches.prod?.date)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* PROD Deployed */}
                      <TableCell sx={{ borderRight: '2px solid #ccc', bgcolor: '#fffbf5' }}>
                        {deployed.prod ? (
                          <Chip
                            label={`v${deployed.prod}`}
                            size="small"
                            color={deployed.prod === repo.branches.prod?.version ? 'success' : 'warning'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {repo.isFailover ? 'N/A' : 'N/A'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Pipeline status */}
                      <TableCell>
                        <Chip
                          icon={pipelineStatus.status === 'synced' ?
                            <CheckCircleIcon /> : <WarningIcon />}
                          label={pipelineStatus.label}
                          color={pipelineStatus.color}
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Detailed commit history for each repo */}
      {repoData.map((repo) => (
        <Accordion key={repo.name} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: repo.color
                }}
              />
              <Typography fontWeight="bold">{repo.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Recent commits
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {['dev', 'test', 'prod'].map((env) => {
                const branch = repo.branches[env];
                const loadingKey = `${repo.name}-${env}`;
                const isLoadingMore = loadingMore[loadingKey];
                const currentCount = commitCounts[repo.name]?.[env] || DEFAULT_COMMITS;

                return (
                  <Paper key={env} sx={{ flex: 1, minWidth: 300, p: 2 }} variant="outlined">
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      {env === 'dev' ? 'DEVL' : env.toUpperCase()}
                      {branch?.version && (
                        <Chip label={`v${branch.version}`} size="small" sx={{ ml: 1 }} />
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        ({branch?.commits?.length || 0} commits)
                      </Typography>
                    </Typography>

                    {branch?.commits?.slice(0, currentCount).map((commit, idx) => (
                      <Box
                        key={`${commit.sha}-${idx}`}
                        sx={{
                          py: 0.5,
                          borderBottom: idx < (branch.commits.length - 1) ? '1px solid' : 'none',
                          borderColor: 'divider'
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                        >
                          <span style={{ color: '#1976d2' }}>{commit.sha}</span>{' '}
                          {commit.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(commit.date)}
                        </Typography>
                      </Box>
                    ))}

                    <Button
                      size="small"
                      startIcon={isLoadingMore ? <CircularProgress size={14} /> : <AddIcon />}
                      onClick={() => fetchMoreCommits(repo.name, env)}
                      disabled={isLoadingMore}
                      sx={{ mt: 1, textTransform: 'none' }}
                      fullWidth
                      variant="outlined"
                    >
                      {isLoadingMore ? 'Loading...' : `Get More (+${MORE_COMMITS})`}
                    </Button>
                  </Paper>
                );
              })}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Data fetched from GitHub API. Rate limit: 60 requests/hour for unauthenticated requests.
      </Typography>
    </Box>
  );
}
