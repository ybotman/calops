/**
 * Utility functions for formatting log data
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format timestamp for display
 * @param {string|Date} timestamp - Log timestamp
 * @param {boolean} relative - Whether to show relative time
 * @returns {string} Formatted timestamp
 */
export const formatTimestamp = (timestamp, relative = false) => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    if (relative) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM dd, yyyy HH:mm:ss');
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Invalid date';
  }
};

/**
 * Format duration in milliseconds to human readable
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (duration) => {
  if (!duration || duration === 0) return '-';
  
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    return `${(duration / 60000).toFixed(1)}m`;
  }
};

/**
 * Format HTTP status with appropriate color
 * @param {number} status - HTTP status code
 * @returns {object} Status info with color
 */
export const formatHttpStatus = (status) => {
  if (!status) return { text: '-', color: 'default' };
  
  if (status >= 200 && status < 300) {
    return { text: status, color: 'success' };
  } else if (status >= 400 && status < 500) {
    return { text: status, color: 'warning' };
  } else if (status >= 500) {
    return { text: status, color: 'error' };
  }
  
  return { text: status, color: 'default' };
};

/**
 * Format error details for display
 * @param {object} error - Error object
 * @returns {string} Formatted error message
 */
export const formatError = (error) => {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  if (error.message) {
    return error.message;
  }
  
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return 'Error details unavailable';
  }
};

/**
 * Format user display name
 * @param {object} log - Log entry
 * @returns {string} User display name
 */
export const formatUserName = (log) => {
  if (log.userName) return log.userName;
  if (log.userEmail) return log.userEmail.split('@')[0];
  if (log.userId) return `User: ${log.userId.substring(0, 8)}...`;
  return 'System';
};

/**
 * Get date range for quick filters
 * @param {string} filter - Quick filter value
 * @returns {object} Start and end dates
 */
export const getQuickFilterDates = (filter) => {
  const now = new Date();
  const start = new Date();
  
  switch (filter) {
    case '24h':
      start.setHours(now.getHours() - 24);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    default:
      return { start: null, end: null };
  }
  
  return {
    start: start.toISOString(),
    end: now.toISOString()
  };
};

/**
 * Format log details for expanded view
 * @param {object} log - Log entry
 * @returns {object} Formatted details
 */
export const formatLogDetails = (log) => {
  const details = {
    'Timestamp': formatTimestamp(log.timestamp),
    'Level': log.level,
    'Action': log.action,
    'Resource': log.resource,
    'Resource ID': log.resourceId || '-',
    'Status': log.status,
    'HTTP Status': log.httpStatus || '-',
    'Duration': formatDuration(log.duration),
    'User ID': log.userId || '-',
    'User Name': log.userName || '-',
    'User Email': log.userEmail || '-',
    'Organization ID': log.orgId || '-',
    'IP Address': log.ip || '-',
    'User Agent': log.userAgent || '-',
    'Endpoint': log.endpoint || '-',
    'Method': log.method || '-',
    'App ID': log.appId || '-'
  };
  
  // Add location info if present
  if (log.userCity) details['User City'] = log.userCity;
  if (log.userRegion) details['User Region'] = log.userRegion;
  if (log.userDivision) details['User Division'] = log.userDivision;
  
  // Add organizer info if present
  if (log.organizerName) details['Organizer Name'] = log.organizerName;
  if (log.organizerId) details['Organizer ID'] = log.organizerId;
  
  // Add error details if present
  if (log.error) {
    details['Error Message'] = log.error.message || '-';
    details['Error Type'] = log.error.type || '-';
    if (log.error.stack) {
      details['Stack Trace'] = log.error.stack;
    }
  }
  
  // Add additional details if present
  if (log.details && typeof log.details === 'object') {
    details['Additional Details'] = JSON.stringify(log.details, null, 2);
  }
  
  return details;
};