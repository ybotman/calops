/**
 * API Client
 * Centralized module for accessing backend API endpoints
 */

import usersApi from './users';
import rolesApi from './roles';
import venuesApi from './venues';
import applicationsApi from './applications';
import masteredLocationsApi from './mastered-locations';
import organizersApi from './organizers';

// Re-export individual APIs
export {
  usersApi,
  rolesApi,
  venuesApi,
  applicationsApi,
  masteredLocationsApi,
  organizersApi
};

// Default export with all APIs
export default {
  users: usersApi,
  roles: rolesApi,
  venues: venuesApi,
  applications: applicationsApi,
  masteredLocations: masteredLocationsApi,
  organizers: organizersApi
};