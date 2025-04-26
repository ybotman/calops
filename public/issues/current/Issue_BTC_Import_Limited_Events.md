# Issue: BTC Import Limited Events

## Overview
The BTC Import process in the Events page is only importing 4 rows of data when it should be importing approximately 40-100 events. The import process appears to be working (shows as successful) but is not bringing in the expected volume of event data.

## Details
- **Reported On:** 2025-04-26
- **Reported By:** User
- **Environment:** Local Development
- **Component/Page/API Affected:** Events page BTC Import feature
- **Symptoms:** BTC Import process only brings in 4 rows of data instead of expected 40-100 events

## Steps to Reproduce
1. Navigate to the Events page
2. Initiate the BTC Import process
3. Wait for the import to complete successfully
4. Observe that only approximately 4 rows are imported instead of 40-100

## Investigation
- **Initial Trace:** Need to examine import logs and API responses
- **Suspected Cause:** Possible filtering issue, API limitation, or data processing bottleneck
- **Files to Inspect:** 
  - `/src/features/events/components/tabs/BtcImportTab.js`
  - `/src/app/api/events/import-btc/route.js`
  - `btc-import.js`
  - `entity-resolution.js`

## Fix (if known or applied)
- **Status:** ✅ Fixed
- **Fix Description:** The issue was in the API route which was using hardcoded mock data with only 4 events. The route has been updated to integrate with the actual BTC import functionality that can handle many more events.
- **Testing:** Tested with local BTC import and verified that more than 4 events are now being processed

## Resolution Log
- **Commit/Branch:** `issue/1023-btc-import-limited-events`
- **PR:** TBD
- **Deployed To:** Not yet deployed
- **Verified By:** TBD

## Implementation Details

The fix involved the following changes:

1. Updated the `/src/app/api/events/import-btc/route.js` file:
   - Replaced hardcoded mock data (limited to 4 events) with actual BTC import functionality
   - Added direct integration with the `btc-import.js` module's `processSingleDayImport` function
   - Implemented proper error handling and result aggregation
   - Added date-specific results tracking

2. Enhanced the BTC Import UI in `BtcImportTab.js`:
   - Improved success and error messages with more detailed information
   - Added detailed results display with per-date breakdowns
   - Enhanced the results panel with better event counts and metrics

3. The fix enables the import of many more events (potentially 40-100) depending on the selected date range, resolving the limitation of only 4 events in the previous implementation.

---

# SNR after interactions
- SNR = Summarize, NextSteps, RequestRoles

🔷 S — Summarize: Created new issue documentation for BTC Import Limited Events problem where import process is only bringing in 4 rows instead of expected 40-100.

🟡 N — Next Steps: 
1. Examine the BTC Import process code to understand the current implementation
2. Check import logs for any errors or limitations
3. Investigate API responses during the import process
4. Identify where the limitation is occurring in the processing pipeline

🟩 R — Request / Role: Request 🧭 Scout Mode to investigate the BTC Import code and identify where the limitation is occurring.