/**
 * useApplications - Custom hook for managing applications data
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';
const applicationsApi = apiClient.applications;

const useApplications = (initialFilters = {}) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  // Fetch applications data
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await applicationsApi.getApplications(filters);
      
      if (result.error) {
        setError(result.message || 'Failed to fetch applications');
        setApplications([]);
      } else {
        setApplications(result);
      }
    } catch (err) {
      console.error('Error in useApplications hook:', err);
      setError(err.message || 'An unexpected error occurred while fetching applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Create a new application
  const createApplication = useCallback(async (applicationData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await applicationsApi.createApplication(applicationData);
      
      if (result.error) {
        setError(result.message || 'Failed to create application');
        return { success: false, error: result.message };
      } else {
        // Refresh applications list
        await fetchApplications();
        return { success: true, application: result.application };
      }
    } catch (err) {
      console.error('Error creating application:', err);
      setError(err.message || 'An unexpected error occurred while creating the application');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);

  // Update an existing application
  const updateApplication = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await applicationsApi.updateApplication(id, updates);
      
      if (result.error) {
        setError(result.message || `Failed to update application ${id}`);
        return { success: false, error: result.message };
      } else {
        // Refresh applications list
        await fetchApplications();
        return { success: true, application: result };
      }
    } catch (err) {
      console.error(`Error updating application ${id}:`, err);
      setError(err.message || 'An unexpected error occurred while updating the application');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);

  // Delete an application
  const deleteApplication = useCallback(async (id, hardDelete = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await applicationsApi.deleteApplication(id, hardDelete);
      
      if (result.error) {
        setError(result.message || `Failed to delete application ${id}`);
        return { success: false, error: result.message };
      } else {
        // Refresh applications list
        await fetchApplications();
        return { success: true, message: result.message };
      }
    } catch (err) {
      console.error(`Error deleting application ${id}:`, err);
      setError(err.message || 'An unexpected error occurred while deleting the application');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchApplications]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  // Load applications on mount and when filters change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    filters,
    updateFilters,
    createApplication,
    updateApplication,
    deleteApplication,
    refreshApplications: fetchApplications
  };
};

export default useApplications;