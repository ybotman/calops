# PMR: BTC Event Import - Actual Import Execution

## Overview
This document outlines the execution plan for the actual non-dry-run import of Boston Tango Calendar (BTC) events into TangoTiempo (TT). This follows the successful completion of entity resolution testing in dry-run mode, which achieved 100% entity resolution success.

## Current Status
- ✅ **Phase 1 (Design and Mapping)**: Completed - Entity resolution mechanisms implemented and tested
- 🚧 **Phase 2 (Test Import)**: In Progress - Actual import attempted but encountered authentication issues
- ⏳ **Phase 3-5**: Pending

## Execution Results

The actual import was executed on 2025-04-24 with the following results:

### Import Metrics
- **Date**: 2025-07-23 (test date 90 days in future)
- **BTC Events**: 4 events retrieved
- **Entity Resolution**: 100% success rate (4/4)
- **Validation**: 100% success rate (4/4)
- **Event Creation**: 0% success rate (0/4) - API authentication errors
- **Duration**: 2.06 seconds

### Issues Encountered
- Authentication errors (401) with message "No token provided" when attempting to create events
- The script successfully retrieved events from BTC and resolved all entities
- All events passed validation checks
- Event creation failed due to missing authentication token

### Resolution Steps
1. ⬜ Configure environment variable for AUTH_TOKEN before retrying
2. ⬜ Verify API credentials and permissions
3. ⬜ Test authentication separately before full import retry

## Pre-Execution Checklist

Before re-executing the actual import, verify the following:

1. ✅ **Entity Resolution**: Achieved 100% success rate in both dry-run and actual testing
2. ✅ **API Endpoints**: All required endpoints functioning correctly
   - Venues API: Using `response.data.data` structure
   - Organizers API: Using `response.data.organizers` structure
   - Categories API: Using `response.data.data` structure
3. ✅ **Fallback Mechanisms**: Implemented and tested
   - NotFound venue for unmatched venues
   - DEFAULT organizer for unmatched organizers
4. ✅ **Go/No-Go Assessment**: Current status is GO based on entity resolution metrics
5. 🔨 **Authentication**: Missing authentication token - needs to be configured
6. ⬜ **Backup**: Perform a backup of events collection before proceeding

## Execution Plan

### Step 1: Fix Authentication Issue
```bash
# Set the AUTH_TOKEN environment variable
export AUTH_TOKEN=your_authentication_token_here

# Verify the token works with a simple API request
curl -H "Authorization: Bearer $AUTH_TOKEN" "http://localhost:3010/api/events?appId=1&limit=1"
```

### Step 2: Backup Current Events
```bash
# Run backup script or manually export events collection
node scripts/backup-events-collection.js
```

### Step 3: Re-Run Actual Import for Test Date
```bash
# Execute the non-dry-run import with authentication token
AUTH_TOKEN=your_token node scripts/btc-import/run-actual-import.js --confirm
```

### Step 4: Verify Imported Events
1. Check TangoTiempo admin UI for newly imported events
2. Verify entity relationships (venues, organizers, categories)
3. Confirm geographic hierarchies are correctly populated
4. Test event display and filtering on frontend

### Step 5: Document Final Results
- Update PMR documentation with actual import results
- Note any issues encountered and their resolutions
- Update status for Phase 2 completion

## Success Criteria
The actual import will be considered successful if:

1. Events are correctly imported with proper entity relationships
2. No duplicate events are created
3. All required fields are populated
4. Events appear correctly in the TangoTiempo UI
5. The Go/No-Go assessment reaches GO status with metrics above thresholds:
   - Entity Resolution Rate: ≥ 90%
   - Validation Rate: ≥ 95%
   - Overall Success Rate: ≥ 85%

## Rollback Plan
If issues are encountered during or after the actual import:

1. Log all errors and issues observed
2. Execute event deletion for the test date:
   ```bash
   # Delete events for specific date
   node scripts/delete-events-by-date.js --date=YYYY-MM-DD
   ```
3. Restore from backup if necessary
4. Fix identified issues in the import code
5. Return to dry-run testing until issues are resolved

## Next Steps After Successful Execution
1. Complete Phase 2 documentation
2. Begin planning for Phase 3 (Historical Data Cleanup)
3. Update PMR status and next steps

## Current Import Parameters
- Test Date: 2025-07-23 (90 days in the future)
- App ID: 1 (TangoTiempo)
- Dry Run: FALSE
- Authentication: Bearer token from environment (currently missing)

## Command Reference
```bash
# Run with explicit date and authentication token
AUTH_TOKEN=your_token node scripts/btc-import/run-actual-import.js --confirm

# Run with environment variables
TEST_DATE=2025-07-23 AUTH_TOKEN=your_token node scripts/btc-import/run-actual-import.js --confirm
```

---

## Related Documents
- [PMR_BTC_EVENT_Import.md](../../public/importingBTC/PMR_BTC_EVENT_Import.md) - Main PMR document
- [PMR_TestRunResults.md](../../public/importingBTC/PMR_TestRunResults.md) - Dry-run test results
- [PMR_Next_Steps.md](../../public/importingBTC/PMR_Next_Steps.md) - Planning for subsequent phases