# PMR: BTC Event Import - Historical Data Cleanup

## Overview
This document outlines the implementation of Phase 3 (Historical Data Cleanup) of the BTC Event Import project. The focus is on developing a strategy and tools for cleaning up historical event data after the successful execution of the test import in Phase 2.

## Current Status
- ✅ **Phase 1 (Design and Mapping)**: COMPLETED
- ✅ **Phase 2 (Test Import)**: COMPLETED
  - ✅ Actual import: COMPLETED (100% success rate)
  - ✅ API verification: COMPLETED (events accessible via API)
- 🚧 **Phase 3 (Historical Data Cleanup)**: IN PROGRESS
  - ✅ Cleanup script development: COMPLETED (2025-04-24)
  - ✅ UI implementation: COMPLETED (2025-04-24)
  - ⏳ Define retention strategy: PENDING
  - ⏳ Test cleanup process: PENDING
  - ⏳ Execute historical cleanup: PENDING
- ⏳ **Phase 4 (Daily Import)**: PENDING
- ⏳ **Phase 5 (Production)**: PENDING

## Implementation Details

### Historical Data Cleanup Script
A dedicated script has been created to handle the cleanup of historical event data with the following features:

1. **Single-Day Targeting**:
   - Process one date at a time to minimize risk
   - Target events based on start date
   - Clean up only events within a specific date range

2. **Safety Features**:
   - Automatic backup before any deletion
   - Default dry-run mode for simulating deletion without actual changes
   - Explicit confirmation required for destructive operations
   - Restore capability to revert changes if issues occur

3. **Authentication**:
   - Uses Firebase authentication token for API access
   - Passes token securely via environment variable

4. **Implementation Path**:
   - Script: `/scripts/btc-import/historical-data-cleanup.js`
   - Usage:
     ```bash
     # Dry run (no actual changes)
     TARGET_DATE=2025-07-23 AUTH_TOKEN=your_token node scripts/btc-import/historical-data-cleanup.js
     
     # Actual deletion with confirmation
     TARGET_DATE=2025-07-23 AUTH_TOKEN=your_token DRY_RUN=false node scripts/btc-import/historical-data-cleanup.js --confirm
     
     # Restore from backup if needed
     AUTH_TOKEN=your_token node scripts/btc-import/historical-data-cleanup.js --restore "path/to/backup/file.json"
     ```

### UI Implementation
A dedicated "BTC Import" tab has been added to the Events management page with the following features:

1. **Date Range Selection**:
   - From Date (afterEqualDate): Start date for event filtering
   - To Date (beforeEqualDate): End date for event filtering
   - Filters by event start date

2. **Authentication**:
   - Secure input field for authentication token
   - Token is not persisted between sessions

3. **Import Options**:
   - Dry Run toggle: Run import without actual data changes
   - Clear button: Reset all fields
   - Import button: Execute the import process

4. **Results Display**:
   - Success/Error notifications
   - Detailed metrics display
   - Import assessment with recommendations

5. **Implementation Path**:
   - Component: `/src/features/events/components/tabs/BtcImportTab.js`
   - API Endpoint: `/src/app/api/events/import-btc/route.js`
   - Integration: Added as a tab to the Events management page

## Historical Data Strategy Recommendations

For historical data cleanup, we recommend the following approach:

1. **Retention Policy**:
   - Delete events older than 6 months
   - Retain all future events from current date
   - Create backup of all deleted events

2. **Execution Plan**:
   - Run script in dry-run mode first
   - Execute actual deletion in one-week batches
   - Verify results after each batch
   - Maintain backup files for at least 3 months

3. **Safety Guidelines**:
   - Always run in dry-run mode before actual deletion
   - Create backups before any destructive operation
   - Use incremental approach (one date/week at a time)
   - Implement rollback capability

## Next Steps

1. **Define Official Retention Strategy**:
   - Decide on exact cutoff date for historical data
   - Document retention policy
   - Schedule phased cleanup over multiple days

2. **Test Cleanup Process**:
   - Run script in dry-run mode for several date ranges
   - Verify backup functionality
   - Test restore capability from backups

3. **Execute Historical Cleanup**:
   - Create backup of events to be deleted
   - Run cleanup script with actual deletion
   - Document cleanup results and metrics

4. **Begin Phase 4 Planning**:
   - Design daily import automation
   - Implement scheduling mechanism

## Technical Implementation Notes

### Script Architecture
The `historical-data-cleanup.js` script follows a modular design:

1. **Configuration Module**:
   - API endpoints and parameters
   - Authentication handling
   - Date formatting and validation

2. **Event Retrieval Module**:
   - Fetch events for a specific date
   - Create backup of events before deletion

3. **Cleanup Module**:
   - Delete events based on date criteria
   - Log results and metrics

4. **Restore Module**:
   - Read backup file
   - Restore events from backup if needed

### UI Component Architecture
The BtcImportTab component follows a structured design:

1. **Input Section**:
   - Date range selectors
   - Authentication input
   - Import options and controls

2. **Processing Section**:
   - Loading indicators
   - Status messages
   - Error handling

3. **Results Section**:
   - Metrics display
   - Assessment indicators
   - Recommendations

## Conclusion
The implementation of Phase 3 has established a robust framework for historical data cleanup with an emphasis on safety, incremental processing, and proper backup mechanisms. The UI integration provides a user-friendly interface for executing imports and managing historical data. The next steps focus on finalizing the retention strategy and executing the cleanup process.