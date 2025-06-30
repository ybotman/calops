# Technical Debt and Known Issues

## Current Issues Requiring Backend Changes

### 1. Venue isApproved Field (Priority: Medium)
**Issue**: The venue approval toggle in the UI doesn't persist to the database
**Root Cause**: Backend venue model schema doesn't include `isApproved` field
**Frontend Status**: Complete - UI ready and waiting
**Backend Status**: Pending - requires schema update

**Details**:
- VenueEditDialog correctly sends `isApproved` field in API requests
- Frontend filtering logic ready for approved/not approved venues
- Backend may be ignoring the field due to schema restrictions
- Need to add `isApproved: Boolean` field to venue model

**Workaround**: None - feature unavailable until backend support added
**Estimated Fix**: 1-2 hours backend development

### 2. User Management Local Admin (Fixed)
~~**Issue**: Local Admin settings not saving~~
**Status**: ✅ RESOLVED - Backend now handles regionalAdminInfo updates correctly

## Future Enhancements

### Venue Geocoding Integration
- Placeholder for geocoding functionality exists
- Requires third-party geocoding service integration
- Current: Manual coordinate entry
- Future: Automatic address → coordinates conversion

## Tracking
- Created: 2025-06-30
- Last Updated: 2025-06-30
- Next Review: Before production deployment