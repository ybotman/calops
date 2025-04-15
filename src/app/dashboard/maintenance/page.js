'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress, 
  Paper,
  Alert, 
  Divider,
  Card,
  CardContent,
  CardActions,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import StorageIcon from '@mui/icons-material/Storage';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function MaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [auditLogStats, setAuditLogStats] = useState(null);
  const [clearResult, setClearResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Maintenance tools
  const maintenanceTools = [
    {
      title: 'Audit Log Cleanup',
      description: 'Clear large audit logs from user documents to improve performance',
      icon: <StorageIcon />,
      action: 'show-section', // Show the audit log section on this page
      id: 'audit-logs'
    },
    {
      title: 'Firebase User Import',
      description: 'Import users from Firebase into the userLogins collection',
      icon: <CloudUploadIcon />,
      action: 'navigate', // Navigate to a different page
      path: '/dashboard/maintenance/firebase-import',
      note: 'If the backend is unreachable, use the direct script: scripts/import-firebase-users.js'
    },
    {
      title: 'Connect Users to Organizers',
      description: 'Link Firebase users to organizers by name matching',
      icon: <LinkIcon />,
      action: 'navigate',
      path: '/dashboard/maintenance/connect-users' // This would be a future tool
    }
  ];

  // Function to get audit log statistics
  const getAuditLogStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/debug/clear-audit-logs');
      setAuditLogStats(response.data.stats);
    } catch (error) {
      console.error('Error getting audit log stats:', error);
      setError('Failed to get audit log statistics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to clear audit logs
  const clearAuditLogs = async () => {
    if (!confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/debug/clear-audit-logs', { appId: '1' });
      setClearResult(response.data);
      
      // Refresh stats after clearing
      await getAuditLogStats();
    } catch (error) {
      console.error('Error clearing audit logs:', error);
      setError('Failed to clear audit logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle tool selection
  const handleToolSelect = (tool) => {
    if (tool.action === 'navigate') {
      router.push(tool.path);
    } else if (tool.action === 'show-section' && tool.id === 'audit-logs') {
      // The audit logs section is already visible
      // You could scroll to it if needed
      const element = document.getElementById('audit-logs-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Maintenance Tools</Typography>
      <Typography variant="body1" paragraph>
        These tools help maintain the database and manage data connections.
        Use them carefully as they directly affect application data.
      </Typography>
      
      {/* Tools Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {maintenanceTools.map((tool, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <Box color="primary.main" mr={1}>
                    {tool.icon}
                  </Box>
                  <Typography variant="h6">{tool.title}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {tool.description}
                </Typography>
                {tool.note && (
                  <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
                    <strong>Note:</strong> {tool.note}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  fullWidth
                  variant="contained"
                  onClick={() => handleToolSelect(tool)}
                >
                  {tool.action === 'navigate' ? 'Open Tool' : 'View'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Audit Log Section */}
      <Box id="audit-logs-section">
        <Typography variant="h5" gutterBottom>Audit Log Maintenance</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          This tool helps manage the audit logs in user documents, which can grow very large and cause performance issues.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                )}
                
                {loading ? (
                  <Box display="flex" justifyContent="center" my={3}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {auditLogStats && (
                      <Box mt={2}>
                        <Typography variant="h6">Audit Log Statistics</Typography>
                        <Paper sx={{ p: 2, mt: 1 }}>
                          <Typography><strong>Total Users:</strong> {auditLogStats.totalUsers}</Typography>
                          <Typography><strong>Users with Audit Logs:</strong> {auditLogStats.usersWithAuditLogs}</Typography>
                          <Typography><strong>Total Audit Log Entries:</strong> {auditLogStats.totalAuditLogEntries}</Typography>
                          <Typography><strong>Estimated Size:</strong> {auditLogStats.estimatedSizeKB} KB ({auditLogStats.estimatedSizeMB} MB)</Typography>
                          
                          <Typography variant="h6" mt={2}>Users by App ID</Typography>
                          {Object.entries(auditLogStats.usersByAppId || {}).map(([appId, count]) => (
                            <Typography key={appId}>
                              <strong>App ID {appId}:</strong> {count} users
                            </Typography>
                          ))}
                        </Paper>
                      </Box>
                    )}
                    
                    {clearResult && (
                      <Box mt={2}>
                        <Typography variant="h6">Cleanup Results</Typography>
                        <Paper sx={{ p: 2, mt: 1 }}>
                          <Typography color="success.main">{clearResult.message}</Typography>
                          <Typography><strong>Space Saved:</strong> {clearResult.stats.spaceSavedKB} KB ({clearResult.stats.spaceSavedMB} MB)</Typography>
                          <Typography><strong>Entries Removed:</strong> {clearResult.stats.entriesRemoved}</Typography>
                          <Typography><strong>Users Updated:</strong> {clearResult.stats.updatedUsers} of {clearResult.stats.totalUsers}</Typography>
                          {clearResult.stats.errors > 0 && (
                            <Typography color="error"><strong>Errors:</strong> {clearResult.stats.errors}</Typography>
                          )}
                        </Paper>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
              
              <CardActions>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={getAuditLogStats}
                  disabled={loading}
                >
                  Check Audit Log Stats
                </Button>
                
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={clearAuditLogs}
                  disabled={loading}
                >
                  Clear All Audit Logs
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}