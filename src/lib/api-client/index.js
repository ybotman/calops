/**
 * API Client
 * Centralized module for accessing backend API endpoints
 */

import usersApi from './users';
import rolesApi from './roles';

// Re-export individual APIs
export {
  usersApi,
  rolesApi
};

// Default export with all APIs
export default {
  users: usersApi,
  roles: rolesApi
};