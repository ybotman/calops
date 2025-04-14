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

export default function StatusPanel() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  const fetchStatus = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime(); // Cache-busting
      const response = await fetch(`/api/status?_=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err.message);
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
  
  // Get overall system status
  const getOverallStatus = () => {
    if (!status) return 'unknown';
    
    if (status.database.status === 'error' || 
        status.firebase.status === 'error' || 
        status.backend.status === 'error') {
      return 'error';
    }
    
    if (status.database.status === 'warning' || 
        status.firebase.status === 'warning' || 
        status.backend.status === 'warning') {
      return 'warning';
    }
    
    return 'ok';
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
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
                  {getStatusIcon(status.database.status)}
                </ListItemIcon>
                <ListItemText 
                  primary="MongoDB Database" 
                  secondary={status.database.message} 
                />
                <Box>{getStatusChip(status.database.status)}</Box>
              </ListItem>
              
              <ListItem divider>
                <ListItemIcon>
                  {getStatusIcon(status.firebase.status)}
                </ListItemIcon>
                <ListItemText 
                  primary="Firebase Authentication" 
                  secondary={status.firebase.message || (status.firebase.initialized ? 'Initialized' : 'Not initialized')} 
                />
                <Box>{getStatusChip(status.firebase.status)}</Box>
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  {getStatusIcon(status.backend.status)}
                </ListItemIcon>
                <ListItemText 
                  primary="Backend API" 
                  secondary={
                    <>
                      {status.backend.message || status.backend.url}
                      {status.backend.fallbackMessage && (
                        <div style={{ marginTop: 4 }}>
                          <small>{status.backend.fallbackMessage}</small>
                        </div>
                      )}
                      {status.backend.apiMessage && (
                        <div style={{ marginTop: 4 }}>
                          <small>{status.backend.apiMessage}</small>
                        </div>
                      )}
                    </>
                  }
                />
                <Box>{getStatusChip(status.backend.status)}</Box>
              </ListItem>
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