'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Chip,
  Divider,
  Button,
  Collapse
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';

// Get the appropriate backend URL based on environment configuration
const getBackendUrl = () => {
  const afEnabled = process.env.NEXT_PUBLIC_AF_ENABLED === 'true';
  if (afEnabled) {
    return process.env.NEXT_PUBLIC_AF_URL || 'http://localhost:7071';
  }
  // Fallback to legacy Express backend (DEPRECATED)
  return process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
};

const getBackendType = () => {
  return process.env.NEXT_PUBLIC_AF_ENABLED === 'true' ? 'Azure Functions' : 'Express (Legacy)';
};

export default function StatusPanel() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [envExpanded, setEnvExpanded] = useState(false);

  // Frontend version info from build-time env vars
  const feVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';
  const feAppName = process.env.NEXT_PUBLIC_APP_NAME || 'calops';
  const feBuildTime = process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown';

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      const backendType = getBackendType();

      // Fetch backend health status
      // Azure Functions uses /api/health, Express uses /health
      const healthPath = backendType === 'Azure Functions' ? '/api/health' : '/health';
      const versionPath = backendType === 'Azure Functions' ? '/api/health/version' : '/health/version';

      // Fetch both health and version endpoints
      const [healthResponse, versionResponse] = await Promise.all([
        fetch(`${backendUrl}${healthPath}`),
        fetch(`${backendUrl}${versionPath}`).catch(() => null)
      ]);

      if (!healthResponse.ok) {
        throw new Error(`Backend health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
      }

      const backendData = await healthResponse.json();
      const versionData = versionResponse?.ok ? await versionResponse.json() : null;

      // Calculate uptime in days from seconds
      // versionData has uptime.processSeconds, backendData has raw uptime in seconds
      const uptimeSeconds = versionData?.uptime?.processSeconds || backendData?.uptime || 0;
      const uptimeDays = (uptimeSeconds / 86400).toFixed(1);
      const uptimeFormatted = uptimeSeconds > 0 ? `${uptimeDays} days` : 'unknown';

      // Backend health indicates DB/Firebase connectivity (API can't respond without them)
      const isHealthy = backendData.status === 'ok' || backendData.status === 'healthy';
      const dbStatus = isHealthy ? 'Connected' : 'Disconnected';

      // Format status data to match expected structure
      const formattedStatus = {
        application: {
          status: 'ok',
          version: feVersion,
          name: feAppName,
          buildTime: feBuildTime,
          message: 'CalOps application running'
        },
        backend: {
          // Spread raw backend data first, then override with formatted values
          ...backendData,
          status: isHealthy ? 'ok' : 'error',
          type: backendType,
          url: backendUrl,
          version: versionData?.version || backendData?.version || 'unknown',
          name: versionData?.name || 'calendar-be-af',
          node: versionData?.node || 'unknown',
          uptime: uptimeFormatted,
          environment: versionData?.environment?.functionApp || backendData?.environment || 'unknown',
          message: `${backendType} ${isHealthy ? 'connected' : 'disconnected'}`,
          apiMessage: `DB: ${dbStatus}, Firebase: ${dbStatus}`
        }
      };

      setStatus(formattedStatus);
      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err.message);

      const backendUrl = getBackendUrl();
      const backendType = getBackendType();

      // Set error status
      setStatus({
        application: {
          status: 'ok',
          version: feVersion,
          name: feAppName,
          buildTime: feBuildTime,
          message: 'CalOps application running'
        },
        backend: {
          status: 'error',
          type: backendType,
          url: backendUrl,
          version: 'unknown',
          message: `${backendType} connection failed`,
          fallbackMessage: err.message
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Status icon mapping
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <HelpIcon sx={{ color: 'info.main' }} />;
    }
  };

  // Status chip mapping
  const getStatusChip = (status) => {
    const colors = {
      ok: 'success',
      warning: 'warning',
      error: 'error',
      unknown: 'default'
    };

    return (
      <Chip
        label={status.toUpperCase()}
        color={colors[status] || 'default'}
        size="small"
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  // Get overall system status (simplified - only checks backend)
  const getOverallStatus = () => {
    if (!status) return 'unknown';

    if (status.backend?.status === 'error') {
      return 'error';
    }

    if (status.backend?.status === 'warning') {
      return 'warning';
    }

    return 'ok';
  };

  // Mask environment variable values (show last 10 characters)
  const maskEnvValue = (value) => {
    if (!value || value.length <= 10) {
      return value;
    }
    const visiblePart = value.slice(-10);
    const maskedPart = '*'.repeat(Math.min(value.length - 10, 20)); // Limit mask length
    return `${maskedPart}${visiblePart}`;
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const toggleEnvExpanded = () => {
    setEnvExpanded(!envExpanded);
  };

  // Get active environment variables
  const getActiveEnvVars = () => {
    const afEnabled = process.env.NEXT_PUBLIC_AF_ENABLED === 'true';
    return [
      {
        name: 'NEXT_PUBLIC_APP_VERSION',
        value: feVersion,
        description: 'CalOps frontend version (from package.json)'
      },
      {
        name: 'NEXT_PUBLIC_BUILD_TIME',
        value: feBuildTime,
        description: 'Build timestamp'
      },
      {
        name: 'NEXT_PUBLIC_AF_ENABLED',
        value: process.env.NEXT_PUBLIC_AF_ENABLED || 'false',
        description: 'Azure Functions enabled (primary backend)'
      },
      {
        name: afEnabled ? 'NEXT_PUBLIC_AF_URL' : 'NEXT_PUBLIC_BE_URL',
        value: getBackendUrl(),
        description: afEnabled ? 'Azure Functions API URL' : 'Legacy Backend API URL (deprecated)'
      },
      {
        name: 'NODE_ENV',
        value: process.env.NODE_ENV || 'development',
        description: 'Node.js environment'
      },
      {
        name: 'VERCEL_ENV',
        value: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || 'N/A',
        description: 'Vercel deployment environment'
      }
    ];
  };

  return (
    <Paper sx={{ p: 0, mb: 3, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" sx={{ mr: 1 }}>System Status</Typography>
          {!loading && status && (
            <>
              <Chip
                label={getOverallStatus().toUpperCase()}
                color={getOverallStatus() === 'ok' ? 'success' :
                      getOverallStatus() === 'warning' ? 'warning' : 'error'}
                size="small"
                sx={{ fontWeight: 'bold', color: 'white', borderColor: 'white', bgcolor: 'transparent' }}
                variant="outlined"
              />
              <Typography variant="body2" sx={{ mx: 1, opacity: 0.9 }}>|</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                FE: v{status.application?.version || feVersion}
              </Typography>
              <Typography variant="body2" sx={{ mx: 0.5, opacity: 0.7 }}>•</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                BE: v{status.backend?.version || 'unknown'}
              </Typography>
            </>
          )}
        </Box>
        <Box>
          <Button
            color="inherit"
            size="small"
            onClick={toggleExpanded}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ mr: 1 }}
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={fetchStatus}
            disabled={loading}
            startIcon={<RefreshIcon />}
            sx={{ bgcolor: 'primary.light' }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : status ? (
            <List disablePadding>
              <ListItem divider>
                <ListItemIcon>
                  {getStatusIcon(status.application?.status || 'ok')}
                </ListItemIcon>
                <ListItemText
                  primary={`CalOps Frontend (v${status.application?.version || feVersion})`}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block">
                        {status.application?.message || 'Running'}
                      </Typography>
                      <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5 }}>
                        Build: {status.application?.buildTime ? new Date(status.application.buildTime).toLocaleString() : 'unknown'}
                      </Typography>
                    </>
                  }
                />
                <Box>{getStatusChip(status.application?.status || 'ok')}</Box>
              </ListItem>

              <ListItem divider>
                <ListItemIcon>
                  {getStatusIcon(status.backend?.status || 'unknown')}
                </ListItemIcon>
                <ListItemText
                  primary={`Backend API: ${status.backend?.name || 'calendar-be-af'} (v${status.backend?.version || 'unknown'})`}
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block">
                        {status.backend?.message || status.backend?.url || 'Checking backend connection...'}
                      </Typography>
                      <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5 }}>
                        Type: {status.backend?.type || 'Unknown'} | Uptime: {status.backend?.uptime || 'unknown'} | Node: {status.backend?.node || 'unknown'}
                      </Typography>
                      <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5 }}>
                        Environment: {status.backend?.environment || 'unknown'}
                      </Typography>
                      {status.backend?.fallbackMessage && (
                        <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5, color: 'error.main' }}>
                          Error: {status.backend.fallbackMessage}
                        </Typography>
                      )}
                      {status.backend?.apiMessage && (
                        <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5 }}>
                          {status.backend.apiMessage}
                        </Typography>
                      )}
                    </>
                  }
                />
                <Box>{getStatusChip(status.backend?.status || 'unknown')}</Box>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <SettingsIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Environment Configuration"
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5 }}>
                        <strong>Backend Type:</strong> {status.backend?.type || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5 }}>
                        <strong>Backend URL:</strong> {maskEnvValue(status.backend?.url)}
                      </Typography>
                      <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5 }}>
                        <strong>App Version:</strong> {status.application?.version || 'N/A'}
                      </Typography>
                      <Box component="span" sx={{ mt: 1, display: 'block' }}>
                        <Button
                          size="small"
                          onClick={toggleEnvExpanded}
                          endIcon={envExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                        >
                          {envExpanded ? 'Hide' : 'Show'} All Environment Variables
                        </Button>
                      </Box>
                    </>
                  }
                />
                <Chip
                  label="INFO"
                  color="info"
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </ListItem>

              <Collapse in={envExpanded}>
                <Box sx={{ px: 3, pb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Active Environment Variables:
                  </Typography>
                  {getActiveEnvVars().map((envVar, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" component="div">
                        <strong>{envVar.name}:</strong> {maskEnvValue(envVar.value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {envVar.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </List>
          ) : (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">No status information available</Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
