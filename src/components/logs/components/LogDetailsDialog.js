'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Grid,
  Chip,
  Paper,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatLogDetails } from '../utils/logFormatters';
import { LOG_LEVEL_COLORS } from '../utils/logConstants';

/**
 * LogDetailsDialog component
 * Shows detailed view of a log entry
 */
const LogDetailsDialog = ({ open, onClose, log }) => {
  if (!log) return null;

  const details = formatLogDetails(log);

  // Copy log to clipboard
  const handleCopyLog = () => {
    const logText = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(logText);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Log Details</Typography>
            <Chip
              label={log.level?.toUpperCase()}
              size="small"
              color={LOG_LEVEL_COLORS[log.level] || 'default'}
            />
            <Chip
              label={log.status}
              size="small"
              color={log.status === 'success' ? 'success' : 'error'}
              variant={log.status === 'success' ? 'outlined' : 'filled'}
            />
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Main Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              General Information
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {Object.entries(details).slice(0, 10).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Typography variant="caption" color="text.secondary">
                      {key}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {value || '-'}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* User & Organization Details */}
          {(log.userName || log.orgId) && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                User & Organization
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  {details['User Name'] && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        User Name
                      </Typography>
                      <Typography variant="body2">{details['User Name']}</Typography>
                    </Grid>
                  )}
                  {details['User Email'] && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        User Email
                      </Typography>
                      <Typography variant="body2">{details['User Email']}</Typography>
                    </Grid>
                  )}
                  {details['Organization ID'] && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Organization ID
                      </Typography>
                      <Typography variant="body2">{details['Organization ID']}</Typography>
                    </Grid>
                  )}
                  {details['User City'] && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2">
                        {[details['User City'], details['User Region'], details['User Division']]
                          .filter(Boolean)
                          .join(', ')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Technical Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Technical Details
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {details['Endpoint'] && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Endpoint
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {details['Method']} {details['Endpoint']}
                    </Typography>
                  </Grid>
                )}
                {details['IP Address'] && details['IP Address'] !== '-' && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      IP Address
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {details['IP Address']}
                    </Typography>
                  </Grid>
                )}
                {details['User Agent'] && details['User Agent'] !== '-' && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      User Agent
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      {details['User Agent']}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>

          {/* Error Details */}
          {log.error && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Error Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'error.lighter' }}>
                {details['Error Message'] && (
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Error Message
                    </Typography>
                    <Typography variant="body2" color="error">
                      {details['Error Message']}
                    </Typography>
                  </Box>
                )}
                {details['Error Type'] && (
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Error Type
                    </Typography>
                    <Typography variant="body2">{details['Error Type']}</Typography>
                  </Box>
                )}
                {details['Stack Trace'] && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Stack Trace
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1, 
                        mt: 1, 
                        bgcolor: 'grey.100',
                        maxHeight: 200,
                        overflow: 'auto'
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="pre"
                        sx={{ 
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          m: 0
                        }}
                      >
                        {details['Stack Trace']}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

          {/* Additional Details */}
          {details['Additional Details'] && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Additional Details
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50',
                  maxHeight: 300,
                  overflow: 'auto'
                }}
              >
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    m: 0
                  }}
                >
                  {details['Additional Details']}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<ContentCopyIcon />}
          onClick={handleCopyLog}
          size="small"
        >
          Copy JSON
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

LogDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  log: PropTypes.object
};

export default LogDetailsDialog;