'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';

export default function FirebaseImportPage() {
  const [loading, setLoading] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [userStats, setUserStats] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch user stats on component mount
  useEffect(() => {
    fetchUserStats();
  }, []);
  
  // Function to fetch user stats
  const fetchUserStats = async () => {
    try {
      setFetchingStats(true);
      setError(null);
      
      const response = await axios.get('/api/debug/import-firebase-users');
      setUserStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError(`Failed to fetch user stats: ${error.message}`);
    } finally {
      setFetchingStats(false);
    }
  };
  
  // Function to import Firebase users
  const importFirebaseUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setImportResult(null);
      
      // Parse the JSON input
      let firebaseUsers;
      try {
        firebaseUsers = JSON.parse(jsonInput);
        
        // If it's an object with a users array, extract that
        if (firebaseUsers.users && Array.isArray(firebaseUsers.users)) {
          firebaseUsers = firebaseUsers.users;
        }
        
        // Ensure it's an array
        if (!Array.isArray(firebaseUsers)) {
          firebaseUsers = [firebaseUsers];
        }
        
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }
      
      // Make the API call
      const response = await axios.post('/api/debug/import-firebase-users', {
        firebaseUsers,
        appId: '1' // Default to TangoTiempo
      });
      
      setImportResult(response.data);
      
      // Refresh the stats
      await fetchUserStats();
    } catch (error) {
      console.error('Error importing Firebase users:', error);
      setError(`Failed to import users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Firebase User Import</Typography>
      <Typography variant="body1" paragraph>
        Use this tool to import Firebase users into the userLogins collection. 
        This creates the necessary MongoDB entries for Firebase users and connects them to the system.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2">Backend Connection Issues?</Typography>
        <Typography variant="body2">
          If you experience backend connection issues, you can use the command-line script:
          <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            node scripts/import-firebase-users.js ./path/to/firebase-users.json
          </Box>
          This script will try to use the backend API first (port 3010), and only fall back to direct MongoDB connection if the API is unavailable.
          <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            API_URL="http://localhost:3010" node scripts/import-firebase-users.js ./path/to/firebase-users.json
          </Box>
          See scripts/FIREBASE_IMPORT_README.md for more details.
        </Typography>
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Import Firebase Users</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Paste the JSON export from Firebase Authentication. This should contain an array of user objects with at least the "uid" field.
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}
              
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Firebase Users JSON"
                variant="outlined"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[
  {
    "uid": "g11kldrWYrgm4b6VnTbRex4hLvi2",
    "email": "user@example.com",
    "displayName": "John Smith"
  },
  ...
]'
                sx={{ mb: 2 }}
              />
              
              <Typography variant="caption" display="block" color="text.secondary">
                For security, all users will be created with the basic "User" role. 
                You can update roles later in the User Management section.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                disabled={loading || !jsonInput.trim()}
                onClick={importFirebaseUsers}
                startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
              >
                {loading ? 'Importing...' : 'Import Users'}
              </Button>
            </CardActions>
          </Card>
          
          {importResult && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <CheckCircleOutlineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Import Completed
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography><strong>Total Users:</strong> {importResult.stats.total}</Typography>
                  <Typography><strong>Created:</strong> {importResult.stats.created}</Typography>
                  <Typography><strong>Updated:</strong> {importResult.stats.updated}</Typography>
                  <Typography><strong>Skipped:</strong> {importResult.stats.skipped}</Typography>
                  <Typography><strong>Errors:</strong> {importResult.stats.errors}</Typography>
                </Box>
                
                {importResult.stats.details.length > 0 && (
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Firebase UID</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Email</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResult.stats.details.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>{detail.uid}</TableCell>
                            <TableCell>
                              <Chip 
                                label={detail.action} 
                                color={
                                  detail.action === 'created' ? 'success' :
                                  detail.action === 'updated' ? 'info' :
                                  detail.action === 'error' ? 'error' : 'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{detail.email || detail.error || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>Current User Stats</Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={fetchUserStats}
                  disabled={fetchingStats}
                >
                  {fetchingStats ? <CircularProgress size={20} /> : 'Refresh'}
                </Button>
              </Box>
              
              {userStats ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body1"><strong>Total Users:</strong> {userStats.totalUsers}</Typography>
                    <Box display="flex" gap={2} mt={1}>
                      <Tooltip title="Users with real Firebase UIDs that can log in">
                        <Chip 
                          icon={<CheckCircleOutlineIcon />} 
                          label={`Firebase Users: ${userStats.realUsers}`}
                          color="success"
                        />
                      </Tooltip>
                      <Tooltip title="Temporary users that cannot log in">
                        <Chip 
                          icon={<InfoIcon />} 
                          label={`Temporary Users: ${userStats.tempUsers}`}
                          color="warning"
                        />
                      </Tooltip>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1">Recent Firebase Users</Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200, mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Firebase UID</TableCell>
                          <TableCell>Organizer</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userStats.realUsersSample.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name || 'Unknown'}</TableCell>
                            <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <Tooltip title={user.firebaseUserId}>
                                <span>{user.firebaseUserId.substring(0, 10)}...</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small"
                                label={user.isOrganizer ? 'Yes' : 'No'} 
                                color={user.isOrganizer ? 'primary' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Typography variant="subtitle1">Recent Temporary Users</Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Temp ID</TableCell>
                          <TableCell>Organizer</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userStats.tempUsersSample.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.name || 'Unknown'}</TableCell>
                            <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <Tooltip title={user.firebaseUserId}>
                                <span>{user.firebaseUserId.substring(0, 10)}...</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small"
                                label={user.isOrganizer ? 'Yes' : 'No'} 
                                color={user.isOrganizer ? 'primary' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : fetchingStats ? (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <Alert severity="info">
                  User statistics not available. Please refresh.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}