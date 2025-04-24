# PMR: BTC Import Next Steps

## Overview
This document outlines the next steps in the BTC Event Import project. Phase 2 (Test Import) has been successfully completed with the execution of the actual import on 2025-04-24. The import achieved a 100% success rate with all BTC events successfully created in TangoTiempo. The project is now moving into Phase 3 (Historical Data).

## Current Status
- ✅ **Phase 1 (Design and Mapping)**: COMPLETED
- ✅ **Phase 2 (Test Import)**: COMPLETED
  - ✅ Dry-run testing: COMPLETED (100% entity resolution success)
  - ✅ Authentication issue: RESOLVED
  - ✅ Category validation issue: RESOLVED
  - ✅ Geolocation issue: RESOLVED
  - ✅ Actual import execution: COMPLETED (100% success rate)
  - ✅ Verification: COMPLETED (2025-04-24)
- 🚧 **Phase 3 (Historical Data)**: IN PROGRESS
  - 🚧 Historical data cleanup script: IN PROGRESS (2025-04-24)
  - ⏳ Define data retention strategy: PENDING
  - ⏳ Test cleanup process: PENDING
  - ⏳ Execute historical cleanup: PENDING
- ⏳ **Phase 4 (Daily Import)**: PENDING
- ⏳ **Phase 5 (Production)**: PENDING

## Immediate Next Steps

### 1. Test Historical Data Cleanup
- **Status**: 🚧 IN PROGRESS
- **Description**: Test the historical data cleanup script to ensure it safely deletes historical events with proper backup
- **Implementation**:
  - Created historical-data-cleanup.js script with the following features:
    - Single day targeting for incremental cleanup
    - Automatic backup before deletion
    - Dry-run capability for safe testing
    - Restore functionality from backup
  - Script usage:
    ```bash
    # Dry run mode (no actual deletion)
    TARGET_DATE=2025-07-23 AUTH_TOKEN=your_token node scripts/btc-import/historical-data-cleanup.js
    
    # Actual deletion with confirmation
    TARGET_DATE=2025-07-23 AUTH_TOKEN=your_token DRY_RUN=false node scripts/btc-import/historical-data-cleanup.js --confirm
    
    # Restore from backup if needed
    AUTH_TOKEN=your_token node scripts/btc-import/historical-data-cleanup.js --restore "path/to/backup/file.json"
    ```
- **Success Criteria**:
  - ✅ Script successfully targets specific date for cleanup
  - ✅ Backup functionality works correctly
  - ⏳ Dry-run mode accurately simulates deletion
  - ⏳ Restoration functionality works in case of issues
- **Timeline**: Complete testing by 2025-04-26

### 2. Define Historical Data Retention Strategy
- **Status**: PENDING
- **Description**: Develop a formal strategy for historical data retention
- **Key Questions**:
  - How far back should we retain historical events?
  - Should we delete all events prior to import or preserve some?
  - How to handle recurring events that span the cutover period?
- **Implementation**:
  - Define cutoff date for historical data (e.g., current month start)
  - Document data retention policy
  - Schedule phased cleanup over multiple days
- **Timeline**: Begin planning immediately after script testing

### 3. Execute Historical Data Cleanup
- **Status**: PENDING
- **Description**: Perform the actual cleanup of historical data according to the defined strategy
- **Implementation**:
  - Execute cleanup script for each date in the cleanup range
  - Document results of cleanup process
  - Verify successful cleanup in TangoTiempo UI
- **Timeline**: After strategy definition and script testing

## Phase 3 Implementation Plan

### Historical Data Cleanup Approach
The historical data cleanup is designed as a cautious, incremental process:

1. **Single-Day Targeting**:
   - Process one date at a time to minimize risk
   - Allow for incremental verification between cleanup operations
   - Easier to restore from backup if issues occur

2. **Safety Features**:
   - Automatic backup before any deletion
   - Default dry-run mode to simulate deletion without actual changes
   - Explicit confirmation required for actual deletion
   - Restore capability to revert changes if needed

3. **Execution Process**:
   - Run in dry-run mode first to verify expected changes
   - Execute actual deletion only after verification
   - Document results of each cleanup operation
   - Perform in batches (e.g., one week at a time) to manage load

4. **Documentation Requirements**:
   - Log number of events deleted per date
   - Maintain record of backup files
   - Document any issues encountered and their resolution
   - Update PMR documentation after each cleanup batch

## Authentication Approach

Authentication has been successfully resolved in Phase 2. The same approach will be used for Phase 3:

```bash
# Set token as environment variable
export AUTH_TOKEN=your_token_here
# Run script using environment variable
node scripts/btc-import/historical-data-cleanup.js
```

## Timeline Overview

1. **Immediate (Current Week)**:
   - Complete historical data cleanup script
   - Test script in dry-run mode
   - Define historical data retention strategy

2. **Near-Term (Next 1-2 Weeks)**:
   - Execute historical data cleanup in batches
   - Document cleanup results
   - Begin design for daily import automation

3. **Medium-Term (2-4 Weeks)**:
   - Complete historical data cleanup
   - Implement daily import automation
   - Prepare for production deployment

## Technical Learnings

The implementation of the historical data cleanup script has provided these key insights:

1. **Safety-First Approach**:
   - Always create backups before destructive operations
   - Use dry-run mode to verify expected behavior
   - Implement explicit confirmation for destructive actions
   - Create restore functionality for rollback capability

2. **Incremental Processing**:
   - Target one date at a time for better control
   - Easier to verify results with smaller batches
   - Reduces risk if issues are encountered
   - Allows for pausing and resuming cleanup process

3. **Authentication Requirements**:
   - Firebase authentication token is required for API access
   - Token can be extracted from browser requests to TangoTiempo UI
   - Environment variable `AUTH_TOKEN` is the safest way to pass the token