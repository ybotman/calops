# Issue: BTC Organizer Import Logging

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
- **Status:** 🚧 In Progress
- **Fix Description:** 
  1. Add enhanced logging to the organizer resolution process
  2. Display detailed source-to-target mapping information in the UI
  3. Include more detailed logs in the filesystem logs
  4. Identify and fix potential API pagination or data loading issues
- **Testing:** Will validate with test imports after implementation

## Resolution Log
- **Commit/Branch:** `issue/1024-btc-organizer-import-logging`
- **PR:** TBD
- **Deployed To:** Not yet deployed
- **Verified By:** TBD

---

# SNR after interactions
- SNR = Summarize, NextSteps, RequestRoles