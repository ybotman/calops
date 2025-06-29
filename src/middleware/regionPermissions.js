/**
 * Middleware for checking region-based permissions
 */

import { 
  canOrganizerAccessRegion, 
  canOrganizerAccessDivision,
  canOrganizerAccessCity,
  canAdminAccessRegion,
  canAdminAccessDivision,
  canAdminAccessCity,
  canManageEventsInLocation 
} from '../lib/permissions.js';

/**
 * Middleware to check if user has access to a specific region
 * Expects regionId in params or body
 */
export function requireRegionAccess(req, res, next) {
  const regionId = req.params.regionId || req.body.masteredRegionId;
  
  if (!regionId) {
    return res.status(400).json({ 
      error: 'Region ID is required' 
    });
  }

  const userLogin = req.user; // Assumes user is attached by auth middleware
  
  if (!userLogin) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  // Check both organizer and admin access
  const hasOrganizerAccess = canOrganizerAccessRegion(userLogin, regionId);
  const hasAdminAccess = canAdminAccessRegion(userLogin, regionId);

  if (!hasOrganizerAccess && !hasAdminAccess) {
    return res.status(403).json({ 
      error: 'Access denied: You do not have permission for this region' 
    });
  }

  // Attach permission level to request
  req.permissions = {
    isOrganizer: hasOrganizerAccess,
    isAdmin: hasAdminAccess,
    regionId: regionId
  };

  next();
}

/**
 * Middleware to check if user has access to a specific division
 */
export function requireDivisionAccess(req, res, next) {
  const divisionId = req.params.divisionId || req.body.masteredDivisionId;
  
  if (!divisionId) {
    return res.status(400).json({ 
      error: 'Division ID is required' 
    });
  }

  const userLogin = req.user;
  
  if (!userLogin) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  const hasOrganizerAccess = canOrganizerAccessDivision(userLogin, divisionId);
  const hasAdminAccess = canAdminAccessDivision(userLogin, divisionId);

  if (!hasOrganizerAccess && !hasAdminAccess) {
    return res.status(403).json({ 
      error: 'Access denied: You do not have permission for this division' 
    });
  }

  req.permissions = {
    isOrganizer: hasOrganizerAccess,
    isAdmin: hasAdminAccess,
    divisionId: divisionId
  };

  next();
}

/**
 * Middleware to check if user has access to a specific city
 */
export function requireCityAccess(req, res, next) {
  const cityId = req.params.cityId || req.body.masteredCityId;
  
  if (!cityId) {
    return res.status(400).json({ 
      error: 'City ID is required' 
    });
  }

  const userLogin = req.user;
  
  if (!userLogin) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  const hasOrganizerAccess = canOrganizerAccessCity(userLogin, cityId);
  const hasAdminAccess = canAdminAccessCity(userLogin, cityId);

  if (!hasOrganizerAccess && !hasAdminAccess) {
    return res.status(403).json({ 
      error: 'Access denied: You do not have permission for this city' 
    });
  }

  req.permissions = {
    isOrganizer: hasOrganizerAccess,
    isAdmin: hasAdminAccess,
    cityId: cityId
  };

  next();
}

/**
 * Middleware to check if user can manage events in a location
 * Expects event location data in body
 */
export function requireEventLocationAccess(req, res, next) {
  const userLogin = req.user;
  
  if (!userLogin) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  const location = {
    masteredRegionId: req.body.masteredRegionId,
    masteredDivisionId: req.body.masteredDivisionId,
    masteredCityId: req.body.masteredCityId
  };

  // At least one location level must be specified
  if (!location.masteredRegionId && !location.masteredDivisionId && !location.masteredCityId) {
    return res.status(400).json({ 
      error: 'Event location (region, division, or city) is required' 
    });
  }

  if (!canManageEventsInLocation(userLogin, location)) {
    return res.status(403).json({ 
      error: 'Access denied: You do not have permission to manage events in this location' 
    });
  }

  req.permissions = {
    hasLocationAccess: true,
    location: location
  };

  next();
}

/**
 * Middleware to check if user has organizer role
 */
export function requireOrganizerRole(req, res, next) {
  const userLogin = req.user;
  
  if (!userLogin) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  if (!userLogin.roles?.includes('RegionalOrganizer')) {
    return res.status(403).json({ 
      error: 'Access denied: Organizer role required' 
    });
  }

  next();
}

/**
 * Middleware to check if user has admin role
 */
export function requireAdminRole(req, res, next) {
  const userLogin = req.user;
  
  if (!userLogin) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  if (!userLogin.roles?.includes('RegionalAdmin')) {
    return res.status(403).json({ 
      error: 'Access denied: Admin role required' 
    });
  }

  next();
}