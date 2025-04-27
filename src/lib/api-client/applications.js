import axios from 'axios';
import { handleAxiosError } from './utils';

const BASE_URL = '/api/applications';

/**
 * Get all applications with optional filters
 * @param {Object} filters - Query parameters
 * @param {boolean} filters.active - Filter by active status
 * @returns {Promise<Array>} - List of applications
 */
export const getApplications = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (filters.active !== undefined) {
      queryParams.append('active', filters.active);
    }
    
    const url = `${BASE_URL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return handleAxiosError(error, 'Failed to fetch applications');
  }
};

/**
 * Get application by ID
 * @param {string} id - Application ID
 * @returns {Promise<Object>} - Application data
 */
export const getApplicationById = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    return handleAxiosError(error, `Failed to fetch application with ID: ${id}`);
  }
};

/**
 * Create a new application
 * @param {Object} applicationData - Application data
 * @returns {Promise<Object>} - Created application
 */
export const createApplication = async (applicationData) => {
  try {
    const response = await axios.post(BASE_URL, applicationData);
    return response.data;
  } catch (error) {
    return handleAxiosError(error, 'Failed to create application');
  }
};

/**
 * Update an existing application
 * @param {string} id - Application ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Updated application
 */
export const updateApplication = async (id, updates) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${id}`, updates);
    return response.data;
  } catch (error) {
    return handleAxiosError(error, `Failed to update application with ID: ${id}`);
  }
};

/**
 * Delete an application
 * @param {string} id - Application ID
 * @param {boolean} hardDelete - Whether to permanently delete
 * @returns {Promise<Object>} - Response message
 */
export const deleteApplication = async (id, hardDelete = false) => {
  try {
    const url = `${BASE_URL}/${id}${hardDelete ? '?hardDelete=true' : ''}`;
    const response = await axios.delete(url);
    return response.data;
  } catch (error) {
    return handleAxiosError(error, `Failed to delete application with ID: ${id}`);
  }
};

const applicationsApi = {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication
};

export default applicationsApi;