/**
 * API Configuration Utility
 * Provides consistent backend URL resolution across the application
 *
 * Primary: Azure Functions (calendar-be-af) on port 7071
 * Fallback: Legacy Express (calendar-be) on port 3010 - DEPRECATED
 */

/**
 * Get the backend API base URL
 * @returns {string} The backend URL based on environment configuration
 */
export function getBackendUrl() {
  const afEnabled = process.env.NEXT_PUBLIC_AF_ENABLED === 'true';

  if (afEnabled) {
    return process.env.NEXT_PUBLIC_AF_URL || 'http://localhost:7071';
  }

  // Fallback to legacy Express backend (DEPRECATED)
  return process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
}

/**
 * Get the backend type for display purposes
 * @returns {string} 'Azure Functions' or 'Express (Legacy)'
 */
export function getBackendType() {
  return process.env.NEXT_PUBLIC_AF_ENABLED === 'true'
    ? 'Azure Functions'
    : 'Express (Legacy)';
}

/**
 * Check if Azure Functions backend is enabled
 * @returns {boolean}
 */
export function isAzureFunctionsEnabled() {
  return process.env.NEXT_PUBLIC_AF_ENABLED === 'true';
}

/**
 * Get the API base URL for axios/fetch calls
 * In development, returns empty string to use Next.js proxy
 * In production, returns the full backend URL
 * @returns {string}
 */
export function getApiBaseUrl() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // In development, use empty string to go through Next.js proxy
  if (isDevelopment) {
    return '';
  }

  // In production, use the full backend URL
  return getBackendUrl();
}

export default {
  getBackendUrl,
  getBackendType,
  isAzureFunctionsEnabled,
  getApiBaseUrl
};
