'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Grid,
  Card,
  CardContent,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GitHubIcon from '@mui/icons-material/GitHub';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// GitHub repos to monitor
const GITHUB_REPOS = [
  { owner: 'ybotman', repo: 'tangotiempo.com', name: 'TangoTiempo Frontend' },
  { owner: 'ybotman', repo: 'calendar-be-af', name: 'Calendar Backend (AF)' },
  { owner: 'ybotman', repo: 'calops', name: 'CalOps Admin' },
];

export default function GitReposPage() {
  const [gitData, setGitData] = useState({});
  const [gitLoading, setGitLoading] = useState(true);
  const [gitError, setGitError] = useState(null);

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

  useEffect(() => {
    fetchGitData();
  }, [fetchGitData]);

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Git Repositories</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchGitData}
          disabled={gitLoading}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        GitHub repository status and recent commits
      </Typography>

      {gitLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {gitError && <Alert severity="error" sx={{ mb: 2 }}>{gitError}</Alert>}

      {!gitLoading && (
        <Grid container spacing={2}>
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
    </Box>
  );
}
