/**
 * Test examples for masteredRegion permissions
 */

import {
  canOrganizerAccessRegion,
  canAdminAccessRegion,
  getOrganizerAllowedRegions,
  getAdminAllowedRegions,
  canManageEventsInLocation,
  isActiveOrganizer,
  isActiveAdmin
} from './permissions.js';

// Example UserLogin documents for testing

const inactiveUser = {
  firebaseUid: 'user123',
  roles: ['NamedUser'],
  regionalOrganizerInfo: {
    isApproved: false,
    isEnabled: false,
    isActive: false,
    allowedMasteredRegionIds: []
  }
};

const activeOrganizer = {
  firebaseUid: 'org456',
  roles: ['NamedUser', 'RegionalOrganizer'],
  regionalOrganizerInfo: {
    organizerId: '507f1f77bcf86cd799439011',
    isApproved: true,
    isEnabled: true,
    isActive: true,
    allowedMasteredRegionIds: ['60a1234567890abcdef12345', '60a1234567890abcdef12346'],
    allowedMasteredDivisionIds: ['60b1234567890abcdef12345'],
    allowedMasteredCityIds: ['60c1234567890abcdef12345']
  }
};

const activeAdmin = {
  firebaseUid: 'admin789',
  roles: ['NamedUser', 'RegionalOrganizer', 'RegionalAdmin'],
  regionalOrganizerInfo: {
    organizerId: '507f1f77bcf86cd799439012',
    isApproved: true,
    isEnabled: true,
    isActive: true,
    allowedMasteredRegionIds: ['60a1234567890abcdef12345'],
    allowedMasteredDivisionIds: [],
    allowedMasteredCityIds: []
  },
  regionalAdminInfo: {
    isApproved: true,
    isEnabled: true,
    isActive: true,
    allowedAdminMasteredRegionIds: ['60a1234567890abcdef12345', '60a1234567890abcdef12347'],
    allowedAdminMasteredDivisionIds: ['60b1234567890abcdef12346'],
    allowedAdminMasteredCityIds: []
  }
};

// Test cases

console.log('=== Permission Tests ===\n');

// Test 1: Inactive user cannot access regions
console.log('1. Inactive user access:');
console.log('   Can access region:', canOrganizerAccessRegion(inactiveUser, '60a1234567890abcdef12345'));
console.log('   Is active organizer:', isActiveOrganizer(inactiveUser));
console.log('');

// Test 2: Active organizer can access allowed regions
console.log('2. Active organizer access:');
console.log('   Can access allowed region:', canOrganizerAccessRegion(activeOrganizer, '60a1234567890abcdef12345'));
console.log('   Can access non-allowed region:', canOrganizerAccessRegion(activeOrganizer, '60a9999999999999999999999'));
console.log('   Allowed regions:', getOrganizerAllowedRegions(activeOrganizer));
console.log('   Is active organizer:', isActiveOrganizer(activeOrganizer));
console.log('');

// Test 3: Admin has both organizer and admin access
console.log('3. Admin access:');
console.log('   Has organizer access to region:', canOrganizerAccessRegion(activeAdmin, '60a1234567890abcdef12345'));
console.log('   Has admin access to region:', canAdminAccessRegion(activeAdmin, '60a1234567890abcdef12345'));
console.log('   Has admin access to different region:', canAdminAccessRegion(activeAdmin, '60a1234567890abcdef12347'));
console.log('   Admin allowed regions:', getAdminAllowedRegions(activeAdmin));
console.log('   Is active admin:', isActiveAdmin(activeAdmin));
console.log('');

// Test 4: Location-based event management
console.log('4. Event location access:');
const eventLocation = {
  masteredRegionId: '60a1234567890abcdef12345',
  masteredDivisionId: '60b1234567890abcdef12345',
  masteredCityId: '60c1234567890abcdef12345'
};

console.log('   Organizer can manage event:', canManageEventsInLocation(activeOrganizer, eventLocation));
console.log('   Admin can manage event:', canManageEventsInLocation(activeAdmin, eventLocation));
console.log('   Inactive user can manage event:', canManageEventsInLocation(inactiveUser, eventLocation));

// Example API route usage
console.log('\n=== Example API Route Usage ===\n');
console.log(`
// In your route file:
import { requireRegionAccess, requireEventLocationAccess } from '../middleware/regionPermissions.js';

// Protect region-specific endpoints
router.get('/api/regions/:regionId/events', requireRegionAccess, (req, res) => {
  // User has access to this region
  // req.permissions contains { isOrganizer: true/false, isAdmin: true/false, regionId }
});

// Protect event creation
router.post('/api/events', requireEventLocationAccess, (req, res) => {
  // User can create events in the specified location
  // req.permissions contains { hasLocationAccess: true, location: {...} }
});
`);