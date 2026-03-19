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
  Button,
  Grid,
  Card,
  CardContent,
  Link
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Vercel deployments to monitor
const VERCEL_DEPLOYMENTS = [
  { name: 'TangoTiempo', prodUrl: 'tangotiempo.com', testUrl: 'tangotiempo-test.vercel.app', project: 'tangotiempo' },
  { name: 'CalOps', prodUrl: 'calops.vercel.app', testUrl: 'calops-test.vercel.app', project: 'calops' },
];

export default function InfrastructurePage() {
  const [vercelStatus, setVercelStatus] = useState({});
  const [vercelLoading, setVercelLoading] = useState(true);

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
    checkVercelStatus();
  }, [checkVercelStatus]);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Deployments</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={checkVercelStatus}
          disabled={vercelLoading}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Vercel deployment status for production and test environments
      </Typography>

      {vercelLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!vercelLoading && (
        <Grid container spacing={2}>
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
    </Box>
  );
}
