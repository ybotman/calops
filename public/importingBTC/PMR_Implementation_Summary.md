# PMR: BTC Event Import - Implementation Summary

## Overview
This document summarizes the implementation of the BTC Event Import project, focusing on the key components, architecture, and current status. It serves as a technical reference for the implementation details.

## Current Status
- ✅ **Phase 1 (Design and Mapping)**: COMPLETED
- 🚧 **Phase 2 (Test Import)**: IN PROGRESS
  - ✅ Dry-run testing: COMPLETED (100% entity resolution success)
  - 🔨 Actual import execution: ATTEMPTED (Authentication issue)
- ⏳ **Phase 3 (Historical Data)**: PENDING
- ⏳ **Phase 4 (Daily Import)**: PENDING
- ⏳ **Phase 5 (Production)**: PENDING

## Implementation Architecture

### Core Components

1. **Import Script (`btc-import.js`)**
   - Main implementation for single-day imports
   - Supports both dry-run and actual import modes
   - Handles the complete import workflow:
     - Fetching events from BTC WordPress site
     - Entity resolution
     - Event transformation
     - Validation
     - Event creation
     - Go/No-Go assessment

2. **Entity Resolution (`entity-resolution.js`)**
   - Handles mapping of BTC entities to TangoTiempo entities
   - Implements caching to minimize API calls
   - Provides fallback mechanisms for unmatched entities
   - Supports geographic hierarchy resolution

3. **Error Handling (`error-handler.js`)**
   - Custom error classes for different error types
   - Comprehensive logging with timestamps
   - API retry mechanism with exponential backoff
   - Error categorization and severity levels

4. **Category Mapping (`categoryMapping.js`)**
   - Maps BTC categories to TangoTiempo categories
   - Handles ignored categories
   - Provides helper functions for consistent mapping

5. **Actual Import Runner (`run-actual-import.js`)**
   - User-friendly interface for running actual imports
   - Confirmation dialogs for safety
   - Authentication verification
   - Detailed output reporting

### Data Flow

1. **BTC Data Source**
   - WordPress API: `wp-json/tribe/events/v1/events?start_date=...`
   - JSON data format includes venues, organizers, categories, and event details

2. **Entity Resolution**
   - Venue resolution via API and fallback to "NotFound" venue
   - Organizer resolution via API and fallback to "DEFAULT" organizer
   - Category mapping and resolution via API

3. **Transformation**
   - Convert BTC event format to TangoTiempo format
   - Add metadata for discovered events
   - Set geographic hierarchy information

4. **Validation**
   - Check required fields
   - Validate date formats and relationships
   - Verify entity references

5. **Import**
   - Delete existing events for the target date
   - Create new events via API
   - Report on success/failure metrics

### Authentication Implementation

The import process requires authentication for write operations:

```javascript
// API call with authentication
const response = await axios.post(`${ttApiBase}/events/post`, eventData, {
  headers: {
    'Authorization': `Bearer ${config.authToken}`
  }
});
```

Authentication token is provided via environment variable:

```bash
# Set token as environment variable
export AUTH_TOKEN=your_token_here

# Or pass directly to script
AUTH_TOKEN=your_token_here node scripts/btc-import/run-actual-import.js
```

## Key Technical Decisions

1. **Dry-Run Mode**
   - Default mode is dry-run (no data changes)
   - Allows testing entity resolution without risk
   - Provides comprehensive metrics on expected results
   - Explicitly disable with `DRY_RUN=false` environment variable

2. **Entity Resolution Fallbacks**
   - "NotFound" venue for unmatched venues
   - "DEFAULT" organizer for unmatched organizers
   - Ensures 100% resolution rate for production reliability

3. **API Response Structure Handling**
   - Each endpoint has different response structure
   - Venues: `response.data.data`
   - Organizers: `response.data.organizers`
   - Categories: `response.data.data`
   - Handled consistently across the implementation

4. **Error Handling Strategy**
   - Retry mechanism for transient errors
   - Detailed error logs for traceability
   - Fallback strategies for non-critical failures
   - Comprehensive Go/No-Go assessment

5. **Authentication Approach**
   - Environment variable-based authentication
   - No tokens stored in code
   - Verification before execution
   - Clear error messaging for authentication issues

## Current Issues and Next Steps

1. **Authentication Issue**
   - Current status: 🔨 STILL BROKEN
   - Authentication errors (401) during event creation
   - Need to implement valid authentication token

2. **Re-Execute Actual Import**
   - Next step after resolving authentication
   - Use the same test date for consistency
   - Verify entity relationships and data quality

3. **Complete Phase 2**
   - Document final results of actual import
   - Update PMR documentation
   - Transition to Phase 3 planning

## File Structure

```
project-root/
  ├── btc-import.js              # Main import implementation
  ├── entity-resolution.js       # Entity resolution functions
  ├── error-handler.js           # Error handling implementation
  ├── scripts/
  │   └── btc-import/
  │       ├── README.md          # General guidance for import scripts
  │       ├── run-actual-import.js  # Script for executing actual imports
  │       ├── test-authentication.js # Script for testing auth
  │       ├── auth-testing.md    # Authentication testing guide
  │       └── PMR_ActualImport.md  # Actual import execution plan
  ├── public/
  │   └── importingBTC/
  │       ├── PMR_BTC_EVENT_Import.md  # Main PMR document
  │       ├── PMR_TestRunResults.md    # Dry-run test results
  │       ├── PMR_Next_Steps.md        # Planning for subsequent phases
  │       ├── PMR_Implementation_Summary.md  # Technical implementation details
  │       ├── categoryMapping.js       # Category mapping implementation
  │       └── eventsLoadingthing.md    # Original PMR overview
  └── import-results/            # Output directory for import results
```

## Testing

The implementation includes several testing mechanisms:

1. **Dry-Run Testing**
   - Validate entity resolution without making changes
   - Verify API response structures
   - Test fallback mechanisms

2. **Go/No-Go Assessment**
   - Metrics-based evaluation of import readiness
   - Entity Resolution Rate: Target ≥ 90%
   - Validation Rate: Target ≥ 95%
   - Overall Success Rate: Target ≥ 85%

3. **Authentication Testing**
   - `test-authentication.js` script for verifying token
   - Tests both read and write operations
   - Clear error reporting for authentication issues

## Future Enhancements

1. **Historical Data Cleanup**
   - Implement Phase 3 with data retention policies
   - Backup mechanisms for safety
   - Comprehensive logging and reporting

2. **Daily Import Automation**
   - Scheduled execution
   - Error monitoring and alerting
   - Status reporting

3. **Production Deployment**
   - Secure authentication token management
   - Performance optimization
   - Monitoring and health checks

## Related Resources

- [PMR_BTC_EVENT_Import.md](./PMR_BTC_EVENT_Import.md) - Main PMR document
- [PMR_TestRunResults.md](./PMR_TestRunResults.md) - Dry-run test results
- [PMR_Next_Steps.md](./PMR_Next_Steps.md) - Planning for subsequent phases
- [scripts/btc-import/PMR_ActualImport.md](../../scripts/btc-import/PMR_ActualImport.md) - Actual import execution plan
- [scripts/btc-import/auth-testing.md](../../scripts/btc-import/auth-testing.md) - Authentication testing guide