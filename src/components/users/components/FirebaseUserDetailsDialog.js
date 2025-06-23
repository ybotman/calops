'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import MobileDialog from '@/components/common/MobileDialog';

/**
 * Helper to copy text to clipboard
 */
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  // TODO: Add toast notification
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * FirebaseUserDetailsDialog component
 * Shows comprehensive Firebase user information
 */
const FirebaseUserDetailsDialog = ({ open, onClose, user }) => {
  if (!user) return null;

  // Extract all available data
  const providerData = user.providerData || [];
  const customClaims = user.customClaims || {};
  const metadata = user.metadata || {};
  
  return (
    <MobileDialog 
      open={open} 
      onClose={onClose}
      title="Firebase User Details"
      maxWidth="md"
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Firebase User Details
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {/* Basic Information */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell><strong>UID</strong></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {user.uid}
                      </Typography>
                      <Tooltip title="Copy UID">
                        <IconButton size="small" onClick={() => copyToClipboard(user.uid)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.userLoginEmail || user.email || 'No email'}
                      {user.emailVerified && (
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Verified" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Display Name</strong></TableCell>
                  <TableCell>{user.displayName || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Phone Number</strong></TableCell>
                  <TableCell>{user.phoneNumber || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Photo URL</strong></TableCell>
                  <TableCell>
                    {user.photoURL ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img 
                          src={user.photoURL} 
                          alt="User" 
                          style={{ width: 40, height: 40, borderRadius: '50%' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {user.photoURL}
                        </Typography>
                      </Box>
                    ) : 'N/A'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Account Status */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>Account Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2"><strong>Active:</strong></Typography>
                {user.disabled ? (
                  <Chip icon={<CancelIcon />} label="Disabled" color="error" size="small" />
                ) : (
                  <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" />
                )}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2"><strong>User Login:</strong></Typography>
                <Chip 
                  label={user.matchStatus === 'matched' ? 'Matched' : 'Unmatched'} 
                  color={user.matchStatus === 'matched' ? 'success' : 'warning'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Timestamps */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>Timestamps</Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell>{formatTimestamp(user.createdAt || metadata.creationTime)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Last Sign In</strong></TableCell>
                  <TableCell>{formatTimestamp(user.lastSignInTime || metadata.lastSignInTime)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>Last Refresh</strong></TableCell>
                  <TableCell>{formatTimestamp(metadata.lastRefreshTime)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Provider Data */}
        {providerData.length > 0 && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>Authentication Providers</Typography>
            {providerData.map((provider, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Chip 
                  label={provider.providerId} 
                  color="primary" 
                  size="small" 
                  sx={{ mb: 1 }}
                />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {provider.uid && (
                        <TableRow>
                          <TableCell><strong>Provider UID</strong></TableCell>
                          <TableCell>{provider.uid}</TableCell>
                        </TableRow>
                      )}
                      {provider.email && (
                        <TableRow>
                          <TableCell><strong>Provider Email</strong></TableCell>
                          <TableCell>{provider.email}</TableCell>
                        </TableRow>
                      )}
                      {provider.displayName && (
                        <TableRow>
                          <TableCell><strong>Provider Name</strong></TableCell>
                          <TableCell>{provider.displayName}</TableCell>
                        </TableRow>
                      )}
                      {provider.photoURL && (
                        <TableRow>
                          <TableCell><strong>Provider Photo</strong></TableCell>
                          <TableCell>
                            <img 
                              src={provider.photoURL} 
                              alt="Provider" 
                              style={{ width: 30, height: 30, borderRadius: '50%' }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {index < providerData.length - 1 && <Divider sx={{ my: 2 }} />}
              </Box>
            ))}
          </Paper>
        )}

        {/* Custom Claims */}
        {Object.keys(customClaims).length > 0 && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>Custom Claims</Typography>
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {Object.entries(customClaims).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell><strong>{key}</strong></TableCell>
                      <TableCell>{JSON.stringify(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* Raw Data (for debugging) */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Raw Firebase Data
            <Tooltip title="Copy JSON">
              <IconButton 
                size="small" 
                onClick={() => copyToClipboard(JSON.stringify(user, null, 2))}
                sx={{ ml: 1 }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 1,
              bgcolor: 'grey.100',
              borderRadius: 1,
              overflow: 'auto',
              maxHeight: 300,
              fontSize: '0.75rem',
              fontFamily: 'monospace'
            }}
          >
            {JSON.stringify(user, null, 2)}
          </Box>
        </Paper>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </MobileDialog>
  );
};

FirebaseUserDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object
};

export default FirebaseUserDetailsDialog;