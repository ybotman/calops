'use client';

import { useState } from 'react';
import { 
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  FormControlLabel,
  Switch,
  Grid,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BackupIcon from '@mui/icons-material/Backup';

/**
 * BTC Event Import tab component for importing events from Boston Tango Calendar
 */
const BtcImportTab = () => {
  // State for import parameters
  const [afterEqualDate, setAfterEqualDate] = useState(null);
  const [beforeEqualDate, setBeforeEqualDate] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [dryRun, setDryRun] = useState(true);
  
  // State for import status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [importResults, setImportResults] = useState(null);
  
  // Function to handle import
  const handleImport = async () => {
    // Validate input
    if (!afterEqualDate) {
      setError('Start date is required');
      return;
    }
    
    if (!beforeEqualDate) {
      setError('End date is required');
      return;
    }
    
    if (!authToken) {
      setError('Authentication token is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setImportResults(null);
    
    try {
      // Format dates for API
      const startDateStr = afterEqualDate.toISOString().split('T')[0];
      const endDateStr = beforeEqualDate.toISOString().split('T')[0];
      
      // Make the API request
      const response = await fetch('/api/events/import-btc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          startDate: startDateStr,
          endDate: endDateStr,
          dryRun,
          appId: '1' // Default app ID
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import events');
      }
      
      const result = await response.json();
      
      // Set success message and results
      setSuccess(dryRun 
        ? 'Dry run completed successfully. No events were created.' 
        : 'Import completed successfully.');
      setImportResults(result);
    } catch (err) {
      setError(err.message || 'An error occurred during import');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle clear
  const handleClear = () => {
    setAfterEqualDate(null);
    setBeforeEqualDate(null);
    setAuthToken('');
    setDryRun(true);
    setError(null);
    setSuccess(null);
    setImportResults(null);
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Import Events from Boston Tango Calendar</Typography>
        
        <Grid container spacing={3}>
          {/* Date Filters */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Date Range</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Specify the date range for events to import. This filters based on event start date.
              </Typography>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <DatePicker
                  label="From Date (Inclusive)"
                  value={afterEqualDate}
                  onChange={setAfterEqualDate}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      size: "small",
                      required: true
                    }
                  }}
                />
                
                <DatePicker
                  label="To Date (Inclusive)"
                  value={beforeEqualDate}
                  onChange={setBeforeEqualDate}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      size: "small",
                      required: true
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>
          
          {/* Authentication */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Authentication</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Provide a valid Firebase authentication token for the import operation.
              </Typography>
              
              <TextField
                label="Authentication Token"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                fullWidth
                size="small"
                required
                type="password"
                sx={{ mt: 2 }}
              />
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Import Options */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Import Options</Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                color="primary"
              />
            }
            label="Dry Run (no actual data changes)"
          />
          
          <Typography variant="body2" color="text.secondary">
            When enabled, the import will run without creating or modifying any events.
            Use this to verify the import process before making actual changes.
          </Typography>
        </Box>
        
        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleImport}
            disabled={loading || !afterEqualDate || !beforeEqualDate || !authToken}
            startIcon={loading ? <CircularProgress size={18} /> : (dryRun ? <UploadFileIcon /> : <BackupIcon />)}
          >
            {loading ? 'Importing...' : (dryRun ? 'Run Dry Import' : 'Run Actual Import')}
          </Button>
        </Box>
      </Paper>
      
      {/* Results and Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Import Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <AlertTitle>Import Successful</AlertTitle>
          {success}
        </Alert>
      )}
      
      {importResults && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Import Results</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Summary</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography>
                  <strong>Date Range:</strong> {importResults.dateRange?.start} to {importResults.dateRange?.end}
                </Typography>
                <Typography>
                  <strong>BTC Events Found:</strong> {importResults.btcEvents?.total || 0}
                </Typography>
                <Typography>
                  <strong>Events Processed:</strong> {importResults.btcEvents?.processed || 0}
                </Typography>
                <Typography>
                  <strong>Import Time:</strong> {importResults.duration?.toFixed(2) || 0} seconds
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">Metrics</Typography>
              <Box sx={{ mt: 1 }}>
                <Typography>
                  <strong>Entity Resolution Success:</strong> {importResults.entityResolution?.success || 0} 
                  ({importResults.btcEvents?.total ? ((importResults.entityResolution?.success / importResults.btcEvents?.total) * 100).toFixed(1) : 0}%)
                </Typography>
                <Typography>
                  <strong>Validation Success:</strong> {importResults.validation?.valid || 0}
                  ({importResults.entityResolution?.success ? ((importResults.validation?.valid / importResults.entityResolution?.success) * 100).toFixed(1) : 0}%)
                </Typography>
                <Typography>
                  <strong>Events Created:</strong> {importResults.ttEvents?.created || 0}
                </Typography>
                <Typography>
                  <strong>Failed Events:</strong> {importResults.ttEvents?.failed || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Assessment */}
          {importResults.assessment && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1">Import Assessment</Typography>
              <Alert 
                severity={importResults.assessment.canProceed ? "success" : "warning"}
                sx={{ mt: 1 }}
              >
                <AlertTitle>
                  {importResults.assessment.canProceed ? "GO ✅" : "NO-GO ❌"}
                </AlertTitle>
                
                {importResults.assessment.recommendations && importResults.assessment.recommendations.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight="bold">Recommendations:</Typography>
                    <ul style={{ marginTop: 4 }}>
                      {importResults.assessment.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Alert>
            </Box>
          )}
        </Paper>
      )}
    </LocalizationProvider>
  );
};

export default BtcImportTab;