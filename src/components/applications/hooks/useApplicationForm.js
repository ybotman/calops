/**
 * useApplicationForm - Custom hook for managing application form state
 */

import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/lib/api-client';
const applicationsApi = apiClient.applications;

const initialFormState = {
  appId: '',
  name: '',
  description: '',
  url: '',
  logoUrl: '',
  isActive: true,
  settings: {
    defaultRegionId: null,
    defaultDivisionId: null,
    defaultCityId: null,
    features: [],
    categorySettings: {}
  }
};

const useApplicationForm = (applicationId = null) => {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  // Fetch application data if in edit mode
  const fetchApplicationData = useCallback(async () => {
    if (!applicationId) {
      setFormData(initialFormState);
      setIsEdit(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await applicationsApi.getApplicationById(applicationId);
      
      if (result.error) {
        setError(result.message || `Failed to fetch application ${applicationId}`);
        setFormData(initialFormState);
      } else {
        setFormData({
          appId: result.appId || '',
          name: result.name || '',
          description: result.description || '',
          url: result.url || '',
          logoUrl: result.logoUrl || '',
          isActive: result.isActive !== undefined ? result.isActive : true,
          settings: {
            defaultRegionId: result.settings?.defaultRegionId || null,
            defaultDivisionId: result.settings?.defaultDivisionId || null,
            defaultCityId: result.settings?.defaultCityId || null,
            features: result.settings?.features || [],
            categorySettings: result.settings?.categorySettings || {}
          }
        });
        setIsEdit(true);
      }
    } catch (err) {
      console.error(`Error fetching application ${applicationId}:`, err);
      setError(err.message || 'Failed to load application data');
      setFormData(initialFormState);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Handle form field changes
  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    
    setFormData(prevData => {
      // Handle checkbox inputs
      if (type === 'checkbox') {
        return {
          ...prevData,
          [name]: checked
        };
      }
      
      // Handle nested settings fields
      if (name.startsWith('settings.')) {
        const settingField = name.split('.')[1];
        return {
          ...prevData,
          settings: {
            ...prevData.settings,
            [settingField]: value
          }
        };
      }
      
      // Handle regular fields
      return {
        ...prevData,
        [name]: value
      };
    });
  }, []);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setError(null);
  }, []);

  // Submit form data
  const handleSubmit = useCallback(async (event) => {
    if (event) event.preventDefault();
    
    setSaving(true);
    setError(null);
    
    try {
      let result;
      
      if (isEdit) {
        // Update existing application
        result = await applicationsApi.updateApplication(applicationId, formData);
      } else {
        // Create new application
        result = await applicationsApi.createApplication(formData);
      }
      
      if (result.error) {
        setError(result.message || 'Failed to save application');
        return { success: false, error: result.message };
      } else {
        return { 
          success: true, 
          application: isEdit ? result : result.application,
          message: isEdit ? 'Application updated successfully' : 'Application created successfully'
        };
      }
    } catch (err) {
      console.error('Error saving application:', err);
      setError(err.message || 'An unexpected error occurred');
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [formData, isEdit, applicationId]);

  // Load application data on initialization if in edit mode
  useEffect(() => {
    fetchApplicationData();
  }, [fetchApplicationData]);

  return {
    formData,
    setFormData,
    loading,
    saving,
    error,
    isEdit,
    handleChange,
    handleSubmit,
    resetForm,
    fetchApplicationData
  };
};

export default useApplicationForm;