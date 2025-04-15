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
  Grid
} from '@mui/material';
import axios from 'axios';

export default function MaintenancePage() {
  const [loading, setLoading] = useState(false);
  const [auditLogStats, setAuditLogStats] = useState(null);
  const [clearResult, setClearResult] = useState(null);
  const [error, setError] = useState(null);

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Maintenance Tools</Typography>
      
      <Divider sx={{ my: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Audit Log Maintenance</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This tool helps manage the audit logs in user documents, which can grow very large and cause performance issues.
              </Typography>
              
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
        
        {/* Additional maintenance tools can be added as more Grid items */}
      </Grid>
    </Box>
  );
}