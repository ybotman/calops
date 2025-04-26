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
- **Status:** 🚧 In Progress
- **Fix Description:** Investigation needed to determine why the import is limited
- **Testing:** Will test with manual BTC import after fix is implemented

## Resolution Log
- **Commit/Branch:** `issue/1023-btc-import-limited-events`
- **PR:** TBD
- **Deployed To:** Not yet deployed
- **Verified By:** TBD

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