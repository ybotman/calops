'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  TextField,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';

/**
 * ImportVenuesDialog component
 * Provides a UI for importing venues from BTC
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Dialog close handler
 * @param {Function} props.onImportComplete - Callback when import completes
 * @returns {JSX.Element} ImportVenuesDialog component
 */
const ImportVenuesDialog = ({ open, onClose, onImportComplete }) => {
  // State
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [options, setOptions] = useState({
    uniqueNameCheck: true,
    updateExisting: false,
    validateGeo: true,
    fallbackToDefaults: true
  });
  const [results, setResults] = useState({
    total: 0,
    imported: 0,
    failed: 0,
    skipped: 0
  });
  const [error, setError] = useState(null);

  // Handle option changes
  const handleOptionChange = (event) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked
    });
  };

  // Add log entry
  const addLogEntry = (entry) => {
    setLogs(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...entry
    }]);
  };

  // Reset state
  const resetState = () => {
    setLoading(false);
    setLogs([]);
    setError(null);
    setResults({
      total: 0,
      imported: 0,
      failed: 0,
      skipped: 0
    });
  };

  // Handle import
  const handleImport = async () => {
    try {
      resetState();
      setLoading(true);
      addLogEntry({ 
        type: 'info', 
        message: 'Starting BTC venues import...',
        details: `Options: ${JSON.stringify(options)}`
      });

      // Call the API to import venues
      const response = await axios.post('/api/venues/import-btc', {
        options: {
          uniqueNameCheck: options.uniqueNameCheck,
          updateExisting: options.updateExisting,
          validateGeo: options.validateGeo,
          fallbackToDefaults: options.fallbackToDefaults
        }
      });

      // Process response
      if (response.data) {
        setResults({
          total: response.data.total || 0,
          imported: response.data.imported || 0,
          failed: response.data.failed || 0,
          skipped: response.data.skipped || 0
        });

        // Add logs from response
        if (response.data.logs && Array.isArray(response.data.logs)) {
          response.data.logs.forEach(logEntry => {
            addLogEntry(logEntry);
          });
        } else {
          addLogEntry({ 
            type: 'success', 
            message: `Import completed: ${response.data.imported} venues imported, ${response.data.failed} failed, ${response.data.skipped} skipped`
          });
        }
      }

      // Callback on complete
      if (onImportComplete) {
        onImportComplete(response.data);
      }
    } catch (err) {
      console.error('Error importing venues:', err);
      setError(err.response?.data?.message || err.message || 'Unknown error occurred during import');
      addLogEntry({ 
        type: 'error', 
        message: 'Import failed',
        details: err.response?.data?.message || err.message || 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Render log entry
  const renderLogEntry = (entry) => {
    const icon = entry.type === 'error' ? 
      <ErrorIcon color="error" /> : 
      entry.type === 'success' ? 
        <CheckCircleIcon color="success" /> : 
        null;

    return (
      <ListItem key={entry.id}>
        {icon && <Box sx={{ mr: 1 }}>{icon}</Box>}
        <ListItemText 
          primary={entry.message}
          secondary={entry.details ? entry.details : null}
        />
      </ListItem>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="import-venues-dialog-title"
    >
      <DialogTitle id="import-venues-dialog-title">
        Import BTC Venues
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Import Options
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.uniqueNameCheck}
                  onChange={handleOptionChange}
                  name="uniqueNameCheck"
                  disabled={loading}
                />
              }
              label="Check for unique venue names"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.updateExisting}
                  onChange={handleOptionChange}
                  name="updateExisting"
                  disabled={loading}
                />
              }
              label="Update existing venues"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.validateGeo}
                  onChange={handleOptionChange}
                  name="validateGeo"
                  disabled={loading}
                />
              }
              label="Validate geolocation"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.fallbackToDefaults}
                  onChange={handleOptionChange}
                  name="fallbackToDefaults"
                  disabled={loading}
                />
              }
              label="Use default values when data missing"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length > 0 ? (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Import Results
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2">
                  Total: {results.total}
                </Typography>
                <Typography variant="body2" color="success.main">
                  Imported: {results.imported}
                </Typography>
                <Typography variant="body2" color="warning.main">
                  Skipped: {results.skipped}
                </Typography>
                <Typography variant="body2" color="error.main">
                  Failed: {results.failed}
                </Typography>
              </Box>
            </Box>

            <Typography variant="subtitle1" gutterBottom>
              Import Logs
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {logs.map(renderLogEntry)}
              </List>
            </Paper>
          </>
        ) : (
          <Box sx={{ textAlign: 'center', my: 3 }}>
            <CloudUploadIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
            <Typography variant="body1" gutterBottom>
              Import venues from BTC and automatically validate them.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Venues will be checked against existing ones by name.
              Imported venues will have their geolocation validated automatically.
              Results will be logged and displayed here.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleImport}
          startIcon={loading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          disabled={loading}
        >
          {loading ? 'Importing...' : 'Import Venues'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportVenuesDialog;