'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing user form state
 * @param {Object} options - Hook options
 * @param {Object} [options.initialData] - Initial form data
 * @param {Function} [options.onSubmit] - Submit callback
 * @returns {Object} Form state and operations
 */
const useUserForm = ({ initialData = {}, onSubmit } = {}) => {
  // Form state
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  
  /**
   * Get a nested value from an object
   * @param {Object} obj - Object to get value from
   * @param {string} path - Path to the value (e.g., 'localUserInfo.firstName')
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} Value at path or defaultValue
   */
  const getNestedValue = useCallback((obj, path, defaultValue = '') => {
    if (!obj || !path) return defaultValue;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === undefined || result === null) return defaultValue;
      result = result[key];
    }
    
    return result === undefined || result === null ? defaultValue : result;
  }, []);
  
  /**
   * Set a nested value in an object
   * @param {Object} obj - Object to set value in
   * @param {string} path - Path to set value at
   * @param {*} value - Value to set
   * @returns {Object} New object with updated value
   */
  const setNestedValue = useCallback((obj, path, value) => {
    if (!path) return obj;
    
    const result = { ...obj };
    const keys = path.split('.');
    
    // Handle single-level property
    if (keys.length === 1) {
      result[path] = value;
      return result;
    }
    
    // Handle nested property
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      current[key] = current[key] || {};
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return result;
  }, []);
  
  /**
   * Handle field change
   * @param {string} fieldPath - Path to the field in formData
   * @param {*} value - New value
   */
  const handleChange = useCallback((fieldPath, value) => {
    setFormData(prev => setNestedValue(prev, fieldPath, value));
    
    // Clear error for this field
    if (errors[fieldPath]) {
      setErrors(prev => ({
        ...prev,
        [fieldPath]: ''
      }));
    }
    
    setIsDirty(true);
  }, [errors, setNestedValue]);
  
  /**
   * Handle toggle/switch change
   * @param {string} fieldPath - Path to the field in formData
   * @returns {Function} Event handler
   */
  const handleToggle = useCallback((fieldPath) => (event) => {
    handleChange(fieldPath, event.target.checked);
  }, [handleChange]);
  
  /**
   * Handle role selection changes
   * @param {string} roleId - Role ID
   * @param {boolean} checked - Whether the role is selected
   */
  const handleRoleChange = useCallback((roleId, checked) => {
    setFormData(prev => {
      // Get current roleIds or initialize empty array
      const currentRoleIds = [...(prev.roleIds || [])].map(role => 
        typeof role === 'object' ? role._id : role
      );
      
      let newRoleIds;
      if (checked) {
        // Add role if it doesn't exist
        newRoleIds = currentRoleIds.includes(roleId) 
          ? currentRoleIds 
          : [...currentRoleIds, roleId];
      } else {
        // Remove role if it exists
        newRoleIds = currentRoleIds.filter(id => id !== roleId);
      }
      
      return {
        ...prev,
        roleIds: newRoleIds
      };
    });
    
    setIsDirty(true);
  }, []);
  
  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setSubmitError(null);
    setIsDirty(false);
  }, [initialData]);
  
  /**
   * Validate form data
   * @returns {boolean} Whether the form is valid
   */
  const validate = useCallback(() => {
    const newErrors = {};
    
    // Validate email if it exists
    if (formData.email !== undefined) {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
    }
    
    // Validate password if it exists
    if (formData.password !== undefined) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    // Validate first name if localUserInfo exists
    if (formData.localUserInfo) {
      if (!formData.localUserInfo.firstName) {
        newErrors['localUserInfo.firstName'] = 'First name is required';
      }
    }
    
    // Validate last name if localUserInfo exists
    if (formData.localUserInfo) {
      if (!formData.localUserInfo.lastName) {
        newErrors['localUserInfo.lastName'] = 'Last name is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);
  
  /**
   * Submit form
   * @returns {Promise<Object>} Submitted data or error
   */
  const submit = useCallback(async () => {
    try {
      setSubmitError(null);
      
      // Validate form
      if (!validate()) {
        return;
      }
      
      setLoading(true);
      
      // If onSubmit callback is provided, call it with form data
      if (typeof onSubmit === 'function') {
        const result = await onSubmit(formData);
        setIsDirty(false);
        return result;
      }
      
      return formData;
    } catch (error) {
      setSubmitError(error.message || 'An error occurred');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, validate]);
  
  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  const handleSubmit = useCallback((event) => {
    if (event) {
      event.preventDefault();
    }
    
    return submit();
  }, [submit]);
  
  return {
    // State
    formData,
    errors,
    loading,
    submitError,
    isDirty,
    
    // Value accessors
    getNestedValue,
    
    // Event handlers
    handleChange,
    handleToggle,
    handleRoleChange,
    handleSubmit,
    
    // Form operations
    reset,
    validate,
    submit
  };
};

export default useUserForm;