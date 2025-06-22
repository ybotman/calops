/**
 * Permission checking utilities for masteredRegion access control
 * Implements region-based permissions for organizers and admins
 */

/**
 * Check if a user has organizer access to a specific region
 * @param {Object} userLogin - UserLogin document with regionalOrganizerInfo
 * @param {String} regionId - MasteredRegion ObjectId to check
 * @returns {Boolean} - Whether user has access
 */
export function canOrganizerAccessRegion(userLogin, regionId) {
  if (!userLogin?.regionalOrganizerInfo) {
    return false;
  }

  const info = userLogin.regionalOrganizerInfo;
  
  // Check if organizer is approved, enabled, and active
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return false;
  }

  // Check if region is in allowed list
  return info.allowedMasteredRegionIds?.some(
    id => id.toString() === regionId.toString()
  ) || false;
}

/**
 * Check if a user has organizer access to a specific division
 * @param {Object} userLogin - UserLogin document
 * @param {String} divisionId - MasteredDivision ObjectId to check
 * @returns {Boolean} - Whether user has access
 */
export function canOrganizerAccessDivision(userLogin, divisionId) {
  if (!userLogin?.regionalOrganizerInfo) {
    return false;
  }

  const info = userLogin.regionalOrganizerInfo;
  
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return false;
  }

  return info.allowedMasteredDivisionIds?.some(
    id => id.toString() === divisionId.toString()
  ) || false;
}

/**
 * Check if a user has organizer access to a specific city
 * @param {Object} userLogin - UserLogin document
 * @param {String} cityId - MasteredCity ObjectId to check
 * @returns {Boolean} - Whether user has access
 */
export function canOrganizerAccessCity(userLogin, cityId) {
  if (!userLogin?.regionalOrganizerInfo) {
    return false;
  }

  const info = userLogin.regionalOrganizerInfo;
  
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return false;
  }

  return info.allowedMasteredCityIds?.some(
    id => id.toString() === cityId.toString()
  ) || false;
}

/**
 * Check if a user has admin access to a specific region
 * @param {Object} userLogin - UserLogin document with localAdminInfo
 * @param {String} regionId - MasteredRegion ObjectId to check
 * @returns {Boolean} - Whether user has access
 */
export function canAdminAccessRegion(userLogin, regionId) {
  if (!userLogin?.localAdminInfo) {
    return false;
  }

  const info = userLogin.localAdminInfo;
  
  // Check if admin is approved, enabled, and active
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return false;
  }

  // Check if region is in allowed admin list
  return info.allowedAdminMasteredRegionIds?.some(
    id => id.toString() === regionId.toString()
  ) || false;
}

/**
 * Check if a user has admin access to a specific division
 * @param {Object} userLogin - UserLogin document
 * @param {String} divisionId - MasteredDivision ObjectId to check
 * @returns {Boolean} - Whether user has access
 */
export function canAdminAccessDivision(userLogin, divisionId) {
  if (!userLogin?.localAdminInfo) {
    return false;
  }

  const info = userLogin.localAdminInfo;
  
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return false;
  }

  return info.allowedAdminMasteredDivisionIds?.some(
    id => id.toString() === divisionId.toString()
  ) || false;
}

/**
 * Check if a user has admin access to a specific city
 * @param {Object} userLogin - UserLogin document
 * @param {String} cityId - MasteredCity ObjectId to check
 * @returns {Boolean} - Whether user has access
 */
export function canAdminAccessCity(userLogin, cityId) {
  if (!userLogin?.localAdminInfo) {
    return false;
  }

  const info = userLogin.localAdminInfo;
  
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return false;
  }

  return info.allowedAdminMasteredCityIds?.some(
    id => id.toString() === cityId.toString()
  ) || false;
}

/**
 * Get all regions a user has organizer access to
 * @param {Object} userLogin - UserLogin document
 * @returns {Array} - Array of allowed region IDs
 */
export function getOrganizerAllowedRegions(userLogin) {
  if (!userLogin?.regionalOrganizerInfo) {
    return [];
  }

  const info = userLogin.regionalOrganizerInfo;
  
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return [];
  }

  return info.allowedMasteredRegionIds || [];
}

/**
 * Get all regions a user has admin access to
 * @param {Object} userLogin - UserLogin document
 * @returns {Array} - Array of allowed admin region IDs
 */
export function getAdminAllowedRegions(userLogin) {
  if (!userLogin?.localAdminInfo) {
    return [];
  }

  const info = userLogin.localAdminInfo;
  
  if (!info.isApproved || !info.isEnabled || !info.isActive) {
    return [];
  }

  return info.allowedAdminMasteredRegionIds || [];
}

/**
 * Check if user has any organizer permissions
 * @param {Object} userLogin - UserLogin document
 * @returns {Boolean} - Whether user is an active organizer
 */
export function isActiveOrganizer(userLogin) {
  if (!userLogin?.regionalOrganizerInfo) {
    return false;
  }

  const info = userLogin.regionalOrganizerInfo;
  return info.isApproved && info.isEnabled && info.isActive;
}

/**
 * Check if user has any admin permissions
 * @param {Object} userLogin - UserLogin document
 * @returns {Boolean} - Whether user is an active admin
 */
export function isActiveAdmin(userLogin) {
  if (!userLogin?.localAdminInfo) {
    return false;
  }

  const info = userLogin.localAdminInfo;
  return info.isApproved && info.isEnabled && info.isActive;
}

/**
 * Check if user can manage events in a location
 * @param {Object} userLogin - UserLogin document
 * @param {Object} location - Object with masteredRegionId, masteredDivisionId, masteredCityId
 * @returns {Boolean} - Whether user can manage events in this location
 */
export function canManageEventsInLocation(userLogin, location) {
  // Admins can manage events in their allowed regions
  if (location.masteredRegionId && canAdminAccessRegion(userLogin, location.masteredRegionId)) {
    return true;
  }
  if (location.masteredDivisionId && canAdminAccessDivision(userLogin, location.masteredDivisionId)) {
    return true;
  }
  if (location.masteredCityId && canAdminAccessCity(userLogin, location.masteredCityId)) {
    return true;
  }

  // Organizers can manage events in their allowed regions
  if (location.masteredRegionId && canOrganizerAccessRegion(userLogin, location.masteredRegionId)) {
    return true;
  }
  if (location.masteredDivisionId && canOrganizerAccessDivision(userLogin, location.masteredDivisionId)) {
    return true;
  }
  if (location.masteredCityId && canOrganizerAccessCity(userLogin, location.masteredCityId)) {
    return true;
  }

  return false;
}