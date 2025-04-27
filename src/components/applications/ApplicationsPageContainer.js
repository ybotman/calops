'use client';

import React, { useState } from 'react';
import ApplicationsPage from './ApplicationsPage';
import { useApplications, useApplicationFilter } from './hooks';

/**
 * Container component for Applications page
 * Handles data fetching, state management, and business logic
 */
const ApplicationsPageContainer = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Use custom hooks for data and filtering
  const applicationsHook = useApplications();
  
  const applicationFilter = useApplicationFilter({
    applications: applicationsHook.applications,
    initialFilters: {
      searchTerm: '',
      tabValue: 0
    }
  });

  // Dialog handlers
  const handleOpenDialog = (application = null) => {
    setSelectedApplication(application);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedApplication(null);
  };

  // Delete confirmation handlers
  const handleDeleteClick = (application) => {
    setSelectedApplication(application);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedApplication) {
      await applicationsHook.deleteApplication(selectedApplication.appId);
      setConfirmDeleteOpen(false);
      setSelectedApplication(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setSelectedApplication(null);
  };

  // Toggle application active status
  const handleToggleActive = async (application) => {
    await applicationsHook.updateApplication(application.appId, {
      isActive: !application.isActive
    });
  };

  // Handle application creation or update
  const handleSaveApplication = async (formData) => {
    if (selectedApplication) {
      // Update existing application
      return await applicationsHook.updateApplication(selectedApplication.appId, formData);
    } else {
      // Create new application
      return await applicationsHook.createApplication(formData);
    }
  };

  // Pass props to presentation component
  const props = {
    // Application data
    applications: applicationsHook.applications,
    filteredApplications: applicationFilter.filteredApplications,
    loading: applicationsHook.loading,
    error: applicationsHook.error,
    
    // Filter controls
    searchTerm: applicationFilter.searchTerm,
    handleSearchChange: applicationFilter.handleSearchChange,
    tabValue: applicationFilter.tabValue,
    handleTabChange: applicationFilter.handleTabChange,
    
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
    refreshApplications: applicationsHook.refreshApplications
  };

  return <ApplicationsPage {...props} />;
};

export default ApplicationsPageContainer;