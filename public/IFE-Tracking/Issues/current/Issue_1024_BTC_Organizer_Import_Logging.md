# Issue: 1024 - BTC Organizer Import Logging

## Overview
The BTC organizer import from BostontangoCalendar.com appears to be failing or not loading all the data. This is causing event imports to fail since the organizer resolution step cannot succeed. Enhanced logging is needed to identify the specific issues with the organizer import process.

## Details
- **Reported On:** 2025-04-26
- **Reported By:** User
- **Environment:** Local Development
- **Component/Page/API Affected:** BTC Import process, organizer resolution
- **Symptoms:** Events fail to import due to organizer resolution failures, but there's insufficient logging to identify the exact cause

## Steps to Reproduce
1. Run a BTC event import
2. Observe that many events fail with "Organizer not found" errors
3. Note the lack of detailed diagnostic information for organizer resolution failures

## Investigation
- **Initial Trace:** Event import logs show organizer resolution failures
- **Suspected Cause:** Possible pagination issues in the source API, missing mappings, or other failures in the organizer resolution process
- **Files to Inspect:** 
  - `entity-resolution.js` (organizer resolution logic)
  - `btc-import.js` (main import process)
  - Logging mechanisms in error-handler.js

## Fix (if known or applied)
- **Status:** ✅ Fixed
- **Fix Description:** 
  1. Added enhanced logging to the organizer resolution process with step-by-step tracing
  2. Created a new UI tab for BTC imports that displays detailed organizer resolution logs
  3. Implemented file-based logging with JSON details of each resolution attempt
  4. Added visual indicators to show which resolution methods succeeded or failed
  5. Created filtering and search capabilities to make diagnosing specific organizer issues easier
- **Testing:** Validated with test imports showing the detailed logging for each organizer resolution attempt

## Resolution Log
- **Commit/Branch:** `issue/1024-btc-organizer-import-logging`
- **PR:** TBD
- **Deployed To:** Not yet deployed
- **Verified By:** TBD

---

## Implementation Details

The implementation includes the following key components:

1. **Enhanced Organizer Resolution in `entity-resolution.js`**:
   - Structured step-by-step approach to organizer resolution
   - Detailed logging of each resolution attempt (btcNiceName, name, default organizer)
   - Complete tracking of API responses, errors, and results
   - JSON log entries for each resolution attempt

2. **New API Endpoint for Log Access**:
   - Created `/api/events/import-btc/organizers` endpoint
   - Retrieves and filters organizer resolution logs
   - Returns statistics on resolution success rates and methods used

3. **UI Components for Viewing Logs**:
   - Added tabs to BTC Import page for Events and Organizers
   - Created detailed log viewer with filtering and search
   - Visual indicators for success/failure of each resolution step
   - Statistics view showing success rates and most used methods

4. **File-based Logging System**:
   - JSON log files for each resolution attempt
   - Organized in `import-results/organizer-resolution/` directory
   - Summary log file for quick overview of all resolution attempts
   - Error details captured for debugging

This implementation makes it much easier to identify why specific organizers fail to resolve and provides valuable data for debugging and improving the import process.

# SNR after interactions
- SNR = Summarize, NextSteps, RequestRoles