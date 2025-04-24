# PMR: BTC Import Next Steps

## Overview
This document outlines the next steps in the BTC Event Import project following the attempted actual import execution. The project is currently in Phase 2 (Test Import) and encountered authentication issues during the actual import attempt.

## Current Status
- ✅ **Phase 1 (Design and Mapping)**: COMPLETED
- 🚧 **Phase 2 (Test Import)**: IN PROGRESS
  - ✅ Dry-run testing: COMPLETED (100% entity resolution success)
  - ✅ Authentication issue: RESOLVED
  - 🔨 Actual import execution: ATTEMPTED (Category validation issue)
- ⏳ **Phase 3 (Historical Data)**: PENDING
- ⏳ **Phase 4 (Daily Import)**: PENDING
- ⏳ **Phase 5 (Production)**: PENDING

## Immediate Next Steps

### 1. Resolve Authentication Issues
- **Status**: ✅ COMPLETED
- **Description**: Fixed authentication token issues for TangoTiempo API access
- **Implementation**:
  - Obtained valid Firebase authentication token from TangoTiempo browser session
  - Verified token works with API requests:
    ```bash
    AUTH_TOKEN="eyJhbGciOiJSUzI1NiI..." node scripts/btc-import/test-authentication.js
    ```
  - Successfully used AUTH_TOKEN environment variable with import script
- **Success Criteria**:
  - ✅ API requests with token returned 200 OK status
  - ✅ Token had appropriate permissions for protected endpoints
- **Completed**: 2025-04-24

### 2. Fix Category Validation Issues
- **Status**: ✅ COMPLETED
- **Description**: Fixed validation errors with category IDs
- **Issue Details**: 
  - The import was using mock category IDs like "mock-category-0rjxjo2" 
  - MongoDB validation fails because these aren't valid ObjectIDs
  - Error: "Cast to ObjectId failed for value \"mock-category-0rjxjo2\""
- **Implementation**:
  - Removed mock category ID generation
  - Implemented fallback to "Unknown" category with valid ObjectID
  - Modified entity-resolution.js to use proper category resolution
- **Success Criteria**:
  - ✅ Category mapping uses valid MongoDB ObjectIDs
  - ✅ No validation errors when creating events
- **Completed**: 2025-04-24

### 3. Fix Geolocation Format Issues
- **Status**: 🔨 IN PROGRESS
- **Description**: Fix server errors related to venue geolocation format
- **Issue Details**: 
  - MongoDB geolocation validation fails with error: "Point must be an array or object, instead got type missing"
  - The venue and city geolocation data is not formatted correctly for GeoJSON
  - MongoDB expects geolocation in format `{ type: "Point", coordinates: [longitude, latitude] }`
- **Implementation**:
  - Update entity-resolution.js to ensure venue geolocation has proper format
  - Ensure both venue and city geolocation fields use the same GeoJSON format
  - Add validation to check geolocation format before sending to API
  ```javascript
  // Proper GeoJSON Point format
  const geoPoint = {
    type: "Point",
    coordinates: [longitude, latitude] // Note: longitude first, then latitude
  };
  ```
- **Success Criteria**:
  - Geolocation data properly formatted as GeoJSON Point objects
  - No server errors (500) when creating events
- **Timeline**: Immediate priority

### 4. Re-Execute Actual (Non-Dry-Run) Import
- **Status**: PENDING
- **Description**: Run the BTC import script with fixed geolocation format
- **Implementation**:
  ```bash
  # Execute the script with actual data creation and authentication
  AUTH_TOKEN=your_token node scripts/btc-import/run-actual-import.js --confirm
  ```
- **Success Criteria**:
  - Events successfully created in TangoTiempo database
  - Entity relationships correctly established
  - Geographic hierarchies properly populated
  - Events display correctly in UI
- **Timeline**: Execute after geolocation format issues are resolved

### 5. Verify Import Results
- **Status**: PENDING
- **Description**: Thoroughly verify the imported events in TangoTiempo database and UI
- **Implementation**:
  - Check TangoTiempo admin UI for newly imported events
  - Verify entity relationships (venues, organizers, categories)
  - Test event filtering and display in frontend
  - Compare imported data with source BTC data
- **Success Criteria**:
  - All events appear correctly in UI
  - Entity relationships are accurate
  - Geographic hierarchies are correct
  - No data anomalies or inconsistencies
- **Timeline**: Immediately following successful import

### 5. Update Documentation with Final Results
- **Status**: PENDING
- **Description**: Document the results of the successful import execution
- **Implementation**:
  - Update PMR_BTC_EVENT_Import.md with final import status
  - Create detailed report of import metrics and outcomes
  - Document any issues encountered and their resolutions
  - Mark Phase 2 as complete if successful
- **Success Criteria**:
  - Comprehensive documentation of actual import results
  - Clear status updates for Phase 2 completion
  - Documented lessons learned and best practices
- **Timeline**: Within 1 day of successful import completion

## Phase 3 Planning: Historical Data Cleanup

### 1. Define Historical Data Strategy
- **Status**: PENDING
- **Description**: Develop strategy for handling legacy events in TangoTiempo
- **Key Questions**:
  - How far back should we retain historical events?
  - Should we delete all events prior to import or preserve some?
  - How to handle recurring events that span the cutover period?
- **Implementation**:
  - Define cutoff date for historical data (e.g., current month start)
  - Document data retention policy
  - Create backup strategy for historical data
- **Timeline**: Begin planning after successful actual import

### 2. Develop Historical Data Cleanup Script
- **Status**: PENDING
- **Description**: Create script to implement the historical data strategy
- **Implementation**:
  - Develop script to identify events for cleanup
  - Implement backup mechanism before deletion
  - Add logging and reporting for cleanup operations
  - Include dry-run capability for testing
- **Success Criteria**:
  - Script correctly identifies events based on strategy
  - Backup functionality works as expected
  - Logging provides clear audit trail
  - Dry-run mode for safe testing
- **Timeline**: After strategy definition

## Authentication Approach

### Current Issues
- The import script is encountering 401 (Unauthorized) errors when attempting to create events
- Error message: "No token provided"
- All other aspects of the import process are working successfully (entity resolution, validation)

### Authentication Solution Options

#### Option 1: Environment Variable
```bash
# Set token as environment variable
export AUTH_TOKEN=your_token_here
# Run script using environment variable
node scripts/btc-import/run-actual-import.js
```

#### Option 2: Authentication File
```javascript
// Create auth.json file with token
{
  "token": "your_token_here",
  "expires": "2025-12-31"
}

// Update import script to read from file
const authConfig = JSON.parse(fs.readFileSync('auth.json', 'utf8'));
const token = authConfig.token;
```

#### Option 3: Login Flow Integration
- Implement a programmatic login flow that obtains a token
- Store token securely for the duration of the import process
- Refresh token if needed during long-running imports

### Recommendation
Option 1 (Environment Variable) is recommended for simplicity and security:
- No tokens stored in code or files
- Compatible with CI/CD pipelines
- Follows standard security practices
- Simplest to implement

## Timeline Overview

1. **Immediate (Current Week)**:
   - Resolve authentication issue
   - Re-execute actual import
   - Verify import results
   - Update documentation

2. **Near-Term (Next 1-2 Weeks)**:
   - Define historical data strategy
   - Develop historical data cleanup script
   - Begin design for daily import automation

3. **Medium-Term (2-4 Weeks)**:
   - Test historical data cleanup
   - Implement daily import automation
   - Prepare for production deployment

## Issues Log

| Issue | Status | Description | Resolution |
|-------|--------|-------------|------------|
| Category API Endpoint | ✅ FIXED | Using incorrect endpoint `/api/event-categories` | Changed to `/api/categories` |
| Venue Resolution | ✅ FIXED | Incorrect API response structure handling | Updated to use `response.data.data` |
| Organizer Resolution | ✅ FIXED | Incorrect API response structure handling | Updated to use `response.data.organizers` |
| Authentication | ✅ FIXED | Missing authentication token for API calls | Implemented AUTH_TOKEN environment variable with Firebase token |
| Category Validation | ✅ FIXED | Mock category IDs not valid MongoDB ObjectIDs | Implemented fallback to "Unknown" category with valid ObjectID |
| Geolocation Format | 🔨 BROKEN | Venue geolocation format not valid for MongoDB | Need to update to proper GeoJSON format with type and coordinates |

## Success Metrics

The following metrics will be used to evaluate success across all phases:

1. **Entity Resolution Rate**: Target ≥ 90% (Current: 100%)
2. **Validation Rate**: Target ≥ 95% (Current: 100%)
3. **Overall Success Rate**: Target ≥ 85% (Current: 0% due to geolocation format issue)
4. **Data Accuracy**: Imported events match source data
5. **Performance**: Import process completes within acceptable timeframe
6. **Reliability**: Daily imports run successfully with minimal manual intervention