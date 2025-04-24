# PMR: BTC Event Import

## Overview
This PMR outlines the phased migration plan to import events from the legacy WordPress site (bostontangocalendar.com) powered by The Events Calendar (TEC) plugin into TangoTiempo.com (TT). The goal is to replace current events with fresh data sourced from WordPress, using a structured, phased import process for stability.

## Status Summary
- ✅ **Phase 1 (Design and Mapping)**: COMPLETED
- 🚧 **Phase 2 (Test Import)**: IN PROGRESS
  - ✅ Dry-run testing: COMPLETED (100% entity resolution success)
  - ✅ Authentication issue: RESOLVED
  - ✅ Category validation issue: RESOLVED
  - 🔨 Actual import execution: ATTEMPTED (Geolocation format issue)
- ⏳ **Phase 3 (Historical Data)**: PENDING
- ⏳ **Phase 4 (Daily Import)**: PENDING
- ⏳ **Phase 5 (Production)**: PENDING

## Go/No-Go Assessment: GO ✅
Based on successful authentication resolution and entity mapping (100% success rate), we have a GO status for proceeding with actual import once geolocation format issues are resolved.

## Phases Detail

### Phase 1: Design, Mapping, and Logic ✅
- ✅ Verified BTC data structure and attributes
- ✅ Mapped fields to TT.com Events collection needs
- ✅ Implemented lookup mechanisms for entities (venues, organizers, categories)
- ✅ Created entity resolution fallbacks for unmatched entities
- ✅ Implemented error handling and logging
- ✅ Developed Go/No-Go assessment metrics

### Phase 2: Single Day Test Import 🚧
- ✅ Developed test import script with dry-run capabilities
- ✅ Fixed entity resolution API endpoints:
  - ✅ Categories: Changed endpoint from `/api/event-categories` to `/api/categories`
  - ✅ Venues: Updated response structure from `.venues` to `.data`
  - ✅ Organizers: Corrected structure to use `.organizers`
- ✅ Implemented fallback mechanisms:
  - ✅ NotFound venue for unmatched venues
  - ✅ DEFAULT organizer for unmatched organizers
  - ✅ Unknown category for unmatched categories
- ✅ Completed dry-run testing with 100% entity resolution success
- ✅ Prepared script for actual (non-dry-run) import execution
- ✅ Successfully resolved authentication issue:
  - ✅ Obtained valid Firebase auth token
  - ✅ Implemented token via AUTH_TOKEN environment variable
  - ✅ Verified token works with test API endpoints
- ✅ Addressed category validation issues:
  - ✅ Removed mock category IDs
  - ✅ Implemented fallback to "Unknown" category
  - ✅ Verified category IDs are valid MongoDB ObjectIDs
- ✅ Executed actual import attempt with authentication and fixed categories:
  - ✅ Entity resolution success: 100%
  - ✅ Validation success: 100%
  - ❌ Event creation failed: Geolocation format errors (500)
- 🔨 Address geolocation format issues:
  - ❌ Current error: "Point must be an array or object, instead got type missing"
  - ⬜ Update venue geolocation format to match MongoDB GeoJSON requirements
- ⬜ Re-execute actual import for a single test date after fixing geolocation format
- ⬜ Verify results in TangoTiempo database and UI

### Phase 3: Historical Data Cleanup ⏳
- ⬜ Define strategy for handling legacy events
- ⬜ Develop cleanup script for outdated events
- ⬜ Test cleanup process in development environment
- ⬜ Document cleanup results and impact

### Phase 4: Daily Import Process ⏳
- ⬜ Develop daily import automation script
- ⬜ Implement date-range based import functionality
- ⬜ Create monitoring and alerting system
- ⬜ Test daily import process in development environment

### Phase 5: Production Deployment ⏳
- ⬜ Prepare production deployment plan
- ⬜ Configure authentication and security for production
- ⬜ Perform final validation in staging environment
- ⬜ Execute production deployment
- ⬜ Monitor initial imports and establish ongoing operations

## Entity Resolution Success
The entity resolution process has been optimized to achieve 100% success rate with the following mechanisms:

1. **Venues**:
   - Primary lookup: Match via TT Venue API using `name`
   - Fallback: Use "NotFound" venue for unmatched venues
   - Response format: Access venues via `response.data.data`

2. **Organizers**:
   - Primary lookup: Match via TT Organizer API using `btcNiceName`
   - Secondary lookup: Match by organizer name
   - Fallback: Use "DEFAULT" organizer (`shortName: "DEFAULT"`) for unmatched organizers
   - Response format: Access organizers via `response.data.organizers`

3. **Categories**:
   - Mapping: Use mapping file for consistent category transformation
   - API lookup: Match against TT Category API using mapped name
   - Response format: Access categories via `response.data.data`

## Actual Import Execution Results (2025-04-24)
- **Test Date**: 2025-07-23 (90 days in future)
- **BTC Events**: 4 events retrieved
- **Entity Resolution**: 100% success rate (4/4)
- **Validation**: 100% success rate (4/4)
- **Event Creation**: Failed due to geolocation format errors (500)
- **Issue 1**: ✅ RESOLVED - Authentication token issue fixed
- **Issue 2**: ✅ RESOLVED - Category validation issue fixed
- **Issue 3**: 🔨 ACTIVE - Venue geolocation format issue

### First Execution Attempt
- Authentication failed with 401 Unauthorized ("No token provided")
- Used valid Firebase token to fix authentication

### Second Execution Attempt (with Authentication)
- Authentication successful (token accepted)
- BTC events retrieved successfully
- Entity resolution working correctly
- Validation passed for all events
- Event creation failed with error:
  ```
  API error (400): {
    "message": "Validation failed. Please check your input data.",
    "errors": [
      {
        "field": "categoryFirstId",
        "message": "Cast to ObjectId failed for value \"mock-category-0rjxjo2\" (type string) at path \"categoryFirstId\" because of \"BSONError\"",
        "type": "ObjectId"
      }
    ]
  }
  ```
- Root cause: Mock category IDs being used instead of real MongoDB ObjectIDs

### Third Execution Attempt (with Authentication and Fixed Categories)
- Authentication successful (token accepted)
- BTC events retrieved successfully
- Entity resolution working correctly with "Unknown" category fallback
- Validation passed for all events
- Event creation failed with error:
  ```
  API error (500): {
    "message": "Error creating event",
    "error": "Can't extract geo keys: { ... } Point must be an array or object, instead got type missing"
  }
  ```
- Root cause: Venue geolocation data not formatted correctly for MongoDB GeoJSON requirements

## Next Steps
1. Fix venue geolocation format issues:
   - Update venue geolocation handling to provide proper GeoJSON Point format
   - Format should be: `{ type: "Point", coordinates: [longitude, latitude] }`
   - Ensure both venue and city geolocation data use the same format
   - Test with a single venue first to validate approach
2. Re-execute actual import with fixed geolocation format
3. Verify results in TangoTiempo database and UI
4. Begin planning for Phase 3 (Historical Data Cleanup)
5. Update PMR documentation with final import results

## Related Documents
- [PMR_TestRunResults.md](./PMR_TestRunResults.md) - Detailed test run results
- [PMR_Next_Steps.md](./PMR_Next_Steps.md) - Planning for subsequent phases
- [categoryMapping.js](./categoryMapping.js) - Category mapping implementation
- [scripts/btc-import/PMR_ActualImport.md](../../scripts/btc-import/PMR_ActualImport.md) - Actual import execution plan and results