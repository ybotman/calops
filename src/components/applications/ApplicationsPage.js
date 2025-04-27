'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Tabs,
  Tab,
  Paper,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import ApplicationCard from './ApplicationCard';
import ApplicationForm from './ApplicationForm';

/**
 * Applications page presentation component
 * Responsible for rendering UI elements based on props from container
 */
const ApplicationsPage = ({
  // Data
  applications,
  filteredApplications,
  loading,
  error,
  
  // Filter controls
  searchTerm,
  handleSearchChange,
  tabValue,
  handleTabChange,
  
  // Dialog state
  openDialog,
  handleOpenDialog,
  handleCloseDialog,
  selectedApplication,
  
  // Delete confirmation
  confirmDeleteOpen,
  handleDeleteClick,
  handleConfirmDelete,
  handleCancelDelete,
  
  // Actions
  handleToggleActive,
  handleSaveApplication,
  refreshApplications
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {/* Page header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Applications
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Application
        </Button>
      </Box>
      
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search applications..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                aria-label="application filter tabs"
              >
                <Tab label="All Applications" />
                <Tab label="Active" />
                <Tab label="Inactive" />
              </Tabs>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Application cards grid */}
      <Box sx={{ mt: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredApplications.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: 'background.paper' }}>
            <Typography variant="h6">
              {applications.length === 0 
                ? 'No applications found. Create your first application!'
                : 'No applications match your search criteria.'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredApplications.map(application => (
              <Grid item xs={12} sm={6} md={4} key={application.appId}>
                <ApplicationCard
                  application={application}
                  onEdit={handleOpenDialog}
                  onDelete={handleDeleteClick}
                  onActivate={handleToggleActive}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      
      {/* Application edit/create dialog */}
      <ApplicationForm
        open={openDialog}
        onClose={handleCloseDialog}
        application={selectedApplication}
        onSave={handleSaveApplication}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the application "{selectedApplication?.name}"?
            {selectedApplication?.isActive && (
              <strong> This application is currently active.</strong>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationsPage;