'use client';

import { useState } from 'react';
import { 
  Box, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress
} from '@mui/material';
import { 
  Storage as DatabaseIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useDatabaseContext } from '@/lib/DatabaseContext';

export default function DatabaseEnvironmentSwitcher() {
  const { environment, switchEnvironment, isTest, isProd, isLoading } = useDatabaseContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingEnvironment, setPendingEnvironment] = useState(null);

  const handleEnvironmentClick = () => {
    setDialogOpen(true);
  };

  const handleEnvironmentChange = (event, newEnvironment) => {
    if (newEnvironment && newEnvironment !== environment) {
      setPendingEnvironment(newEnvironment);
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingEnvironment) {
      switchEnvironment(pendingEnvironment);
      setPendingEnvironment(null);
      setDialogOpen(false);
      // Dialog will stay open briefly to show loading, then page will refresh
    }
  };

  const handleCancelSwitch = () => {
    setPendingEnvironment(null);
    setDialogOpen(false);
  };

  const getEnvironmentColor = () => {
    return isTest ? 'success' : 'warning';
  };

  const getEnvironmentLabel = () => {
    return isTest ? 'TEST' : 'PROD';
  };

  return (
    <>
      <Chip
        icon={isLoading ? <CircularProgress size={16} /> : <DatabaseIcon />}
        label={isLoading ? 'Switching...' : `DB: ${getEnvironmentLabel()}`}
        color={getEnvironmentColor()}
        variant="outlined"
        onClick={!isLoading ? handleEnvironmentClick : undefined}
        disabled={isLoading}
        sx={{ 
          mr: 2, 
          cursor: isLoading ? 'default' : 'pointer',
          '&:hover': !isLoading ? {
            backgroundColor: isTest ? 'success.light' : 'warning.light',
            opacity: 0.8
          } : {}
        }}
      />

      <Dialog 
        open={dialogOpen} 
        onClose={handleCancelSwitch}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DatabaseIcon sx={{ mr: 1 }} />
            Database Environment Selection
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            You are currently connected to the <strong>{getEnvironmentLabel()}</strong> database.
            Switching environments will change which database all operations connect to and refresh the application.
          </Alert>

          {isProd && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
              <strong>Production Database Warning:</strong> You are working with live production data. 
              Please exercise extreme caution with any data modifications.
            </Alert>
          )}

          <Typography variant="h6" gutterBottom>
            Select Database Environment:
          </Typography>

          <ToggleButtonGroup
            value={pendingEnvironment || environment}
            exclusive
            onChange={handleEnvironmentChange}
            fullWidth
            sx={{ mt: 2 }}
          >
            <ToggleButton value="test" sx={{ py: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  TEST Database
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Safe for development and testing
                </Typography>
              </Box>
            </ToggleButton>
            <ToggleButton value="prod" sx={{ py: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  PROD Database
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Live production data - use with caution
                </Typography>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>

          {pendingEnvironment && pendingEnvironment !== environment && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Switching to {pendingEnvironment.toUpperCase()} database.</strong>
                {pendingEnvironment === 'prod' && ' This will connect you to the production database with live data.'}
                {pendingEnvironment === 'test' && ' This will connect you to the test database for safe development.'}
              </Typography>
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancelSwitch}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSwitch}
            variant="contained"
            disabled={!pendingEnvironment || pendingEnvironment === environment}
            color={pendingEnvironment === 'prod' ? 'warning' : 'primary'}
          >
            Switch to {pendingEnvironment?.toUpperCase() || environment.toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}