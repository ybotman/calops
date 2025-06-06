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

export default function StatusPanel() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [envExpanded, setEnvExpanded] = useState(false);
  
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'https://calendarbe-test-bpg5caaqg5chbndu.eastus-01.azurewebsites.net';
      
      // Fetch backend health status
      const response = await fetch(`${backendUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status} ${response.statusText}`);
      }
      
      const backendData = await response.json();
      
      // Format status data to match expected structure
      const formattedStatus = {
        application: {
          status: 'ok',
          version: '1.0.0',
          message: 'CalOps application running'
        },
        backend: {
          status: backendData.status === 'ok' ? 'ok' : 'error',
          url: backendUrl,
          message: `Backend ${backendData.status === 'ok' ? 'connected' : 'disconnected'}`,
          apiMessage: `DB: ${backendData.dbConnected ? 'Connected' : 'Disconnected'}, Firebase: ${backendData.firebaseConnected ? 'Connected' : 'Disconnected'}`,
          ...backendData
        }
      };
      
      setStatus(formattedStatus);
      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err.message);
      
      // Set error status
      setStatus({
        application: {
          status: 'ok',
          version: '1.0.0',
          message: 'CalOps application running'
        },
        backend: {
          status: 'error',
          url: process.env.NEXT_PUBLIC_BE_URL || 'https://calendarbe-test-bpg5caaqg5chbndu.eastus-01.azurewebsites.net',
          message: 'Backend connection failed',
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
  
  // Get active environment variables (exclude legacy/unused ones)
  const getActiveEnvVars = () => {
    return [
      {
        name: 'NEXT_PUBLIC_BE_URL',
        value: process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010',
        description: 'Backend API URL'
      },
      {
        name: 'NODE_ENV',
        value: process.env.NODE_ENV || 'development',
        description: 'Node.js environment'
      },
      {
        name: 'VERCEL_ENV',
        value: process.env.VERCEL_ENV || 'N/A',
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
          color: 'white'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ mr: 2 }}>System Status</Typography>
          {!loading && status && (
            <Chip 
              label={getOverallStatus().toUpperCase()}
              color={getOverallStatus() === 'ok' ? 'success' : 
                    getOverallStatus() === 'warning' ? 'warning' : 'error'}
              size="small"
              sx={{ fontWeight: 'bold', color: 'white', borderColor: 'white', bgcolor: 'transparent' }}
              variant="outlined"
            />
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
                  primary="CalOps Application" 
                  secondary={status.application?.message || `Version ${status.application?.version || '1.0.0'}`} 
                />
                <Box>{getStatusChip(status.application?.status || 'ok')}</Box>
              </ListItem>
              
              <ListItem divider>
                <ListItemIcon>
                  {getStatusIcon(status.backend?.status || 'unknown')}
                </ListItemIcon>
                <ListItemText 
                  primary="Backend API" 
                  secondary={
                    <>
                      <Typography variant="body2" component="span" display="block">
                        {status.backend?.message || status.backend?.url || 'Checking backend connection...'}
                      </Typography>
                      {status.backend?.fallbackMessage && (
                        <Typography variant="caption" component="span" display="block" sx={{ mt: 0.5 }}>
                          {status.backend.fallbackMessage}
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
                        <strong>Backend URL:</strong> {maskEnvValue(status.backend.url)}
                      </Typography>
                      <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5 }}>
                        <strong>App Version:</strong> {status.application?.version || 'N/A'}
                      </Typography>
                      <Typography variant="body2" component="span" display="block" sx={{ mt: 0.5 }}>
                        <strong>Authentication:</strong> Mock authentication (bypassed)
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