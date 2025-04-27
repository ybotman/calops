'use client';

import { useState, useEffect } from 'react';
import { 
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Tab,
  Tabs
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';

/**
 * BTC Organizer Import tab component for displaying organizer resolution logs
 */
const BtcOrganizerTab = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Load logs on mount
  useEffect(() => {
    loadOrganizerLogs();
  }, []);
  
  // Function to load organizer logs
  const loadOrganizerLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query params
      let url = '/api/events/import-btc/organizers?limit=100';
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load organizer logs');
      }
      
      const data = await response.json();
      
      // Filter logs by search term if provided
      let filteredLogs = data.logs;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.source?.name?.toLowerCase().includes(term) ||
          log.source?.email?.toLowerCase().includes(term)
        );
      }
      
      setLogs(filteredLogs);
      setSummary(data.summary || []);
      setStats(data.stats);
    } catch (err) {
      setError(err.message || 'An error occurred loading organizer logs');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };
  
  // Handle search
  const handleSearch = () => {
    loadOrganizerLogs();
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle clear
  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('all');
    loadOrganizerLogs();
  };
  
  // Render attempt result
  const renderAttemptResult = (attempt) => {
    if (!attempt.success) {
      return (
        <Chip 
          label="Failed" 
          color="error" 
          size="small" 
          variant="outlined"
        />
      );
    }
    
    return (
      <Chip 
        label="Success" 
        color="success" 
        size="small" 
        variant="outlined"
      />
    );
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>BTC Organizer Import Logs</Typography>
      
      <Tabs 
        value={activeTab} 
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab label="Resolution Logs" />
        <Tab label="Summary" />
        <Tab label="Stats" />
      </Tabs>
      
      {activeTab === 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Search Organizer"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                size="small"
                placeholder="Search by organizer name or email"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  select
                  label="Status"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  size="small"
                  SelectProps={{ native: true }}
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                </TextField>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={handleSearch}
                  disabled={loading}
                  startIcon={<SearchIcon />}
                >
                  Filter
                </Button>
                
                <Button 
                  variant="outlined" 
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={loadOrganizerLogs}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                >
                  Refresh
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}
          
          {logs.length === 0 && !loading && !error && (
            <Alert severity="info" sx={{ mb: 3 }}>
              No organizer resolution logs found.
            </Alert>
          )}
          
          {logs.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Organizer Resolution Logs ({logs.length})
              </Typography>
              
              <List>
                {logs.map((log, index) => (
                  <Accordion 
                    key={index}
                    expanded={expandedLog === index}
                    onChange={() => setExpandedLog(expandedLog === index ? null : index)}
                    sx={{ mb: 1 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Grid container alignItems="center">
                        <Grid item xs={6}>
                          <Typography variant="subtitle2">
                            {log.source?.name || 'Unknown Organizer'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2">
                            Methods: {log.attempts?.length || 0}
                          </Typography>
                        </Grid>
                        <Grid item xs={3} sx={{ textAlign: 'right' }}>
                          <Chip 
                            label={log.success ? "Success" : "Failed"} 
                            color={log.success ? "success" : "error"} 
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>Source Data</Typography>
                          <Box sx={{ backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                            <Typography variant="body2">
                              <strong>ID:</strong> {log.source?.id || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Name:</strong> {log.source?.name || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Email:</strong> {log.source?.email || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {log.success && log.result && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>Resolved To</Typography>
                            <Box sx={{ backgroundColor: '#f0f7ff', p: 1, borderRadius: 1 }}>
                              <Typography variant="body2">
                                <strong>ID:</strong> {log.result.id || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Name:</strong> {log.result.name || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Source:</strong> {log.result.source || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        
                        {!log.success && log.errorDetails && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>Error Details</Typography>
                            <Box sx={{ backgroundColor: '#fff0f0', p: 1, borderRadius: 1 }}>
                              <Typography variant="body2">
                                <strong>Type:</strong> {log.errorDetails.type || 'N/A'}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Message:</strong> {log.errorDetails.message || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" gutterBottom>Resolution Attempts</Typography>
                          
                          {log.attempts && log.attempts.length > 0 ? (
                            <List 
                              dense 
                              sx={{ 
                                backgroundColor: '#f8f8f8', 
                                borderRadius: 1,
                                maxHeight: '200px',
                                overflow: 'auto'
                              }}
                            >
                              {log.attempts.map((attempt, i) => (
                                <ListItem key={i} divider={i < log.attempts.length - 1}>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">
                                          <strong>Method:</strong> {attempt.method}
                                        </Typography>
                                        {renderAttemptResult(attempt)}
                                      </Box>
                                    }
                                    secondary={
                                      <Box>
                                        {attempt.query && (
                                          <Typography variant="caption" component="div">
                                            Query: {attempt.query}
                                          </Typography>
                                        )}
                                        {attempt.status && (
                                          <Typography variant="caption" component="div">
                                            Status: {attempt.status}
                                          </Typography>
                                        )}
                                        {attempt.resultCount >= 0 && (
                                          <Typography variant="caption" component="div">
                                            Results: {attempt.resultCount}
                                          </Typography>
                                        )}
                                        {attempt.error && (
                                          <Typography variant="caption" component="div" color="error">
                                            Error: {attempt.error}
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No resolution attempts recorded
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </List>
            </Box>
          )}
        </>
      )}
      
      {activeTab === 1 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Recent Resolution Summary
          </Typography>
          
          {summary.length > 0 ? (
            <Box 
              component="pre" 
              sx={{ 
                p: 2, 
                backgroundColor: '#f5f5f5', 
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: '500px',
                fontSize: '0.875rem'
              }}
            >
              {summary.join('\n')}
            </Box>
          ) : (
            <Alert severity="info">
              No summary data available
            </Alert>
          )}
        </Box>
      )}
      
      {activeTab === 2 && stats && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Resolution Statistics
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Success Rate
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1">
                    Successful: {stats.successCount}
                  </Typography>
                  <Chip 
                    label={`${Math.round((stats.successCount / (stats.successCount + stats.failureCount || 1)) * 100)}%`} 
                    color="success" 
                  />
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body1">
                    Failed: {stats.failureCount}
                  </Typography>
                  <Chip 
                    label={`${Math.round((stats.failureCount / (stats.successCount + stats.failureCount || 1)) * 100)}%`} 
                    color="error" 
                  />
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }} elevation={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Methods Used
                </Typography>
                
                {Object.entries(stats.methodsUsed || {}).map(([method, count], index) => (
                  <Box 
                    key={method} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: index < Object.keys(stats.methodsUsed).length - 1 ? 1 : 0
                    }}
                  >
                    <Typography variant="body1">
                      {method}:
                    </Typography>
                    <Chip 
                      label={count} 
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default BtcOrganizerTab;