# BTC Event Import Scripts

This directory contains scripts for importing events from Boston Tango Calendar (BTC) WordPress site to TangoTiempo (TT).

## Overview

The Boston Tango Calendar (BTC) Event Import is a phased migration project to replace the current events in TangoTiempo with fresh data sourced from the WordPress BTC site using The Events Calendar (TEC) REST API.

## Scripts

- `run-actual-import.js` - Execute a non-dry-run import for a single day
  - Creates real events in the TangoTiempo database
  - Includes confirmation dialog for safety
  - Produces detailed logs and reports

## Usage

### Running an Actual Import

```bash
# Standard execution with confirmation dialog
node scripts/btc-import/run-actual-import.js

# Skip confirmation dialog
node scripts/btc-import/run-actual-import.js --confirm

# Use specific date (YYYY-MM-DD format)
TEST_DATE=2023-12-15 node scripts/btc-import/run-actual-import.js
```

### Environment Variables

- `TEST_DATE` - The date to import events for (YYYY-MM-DD format)
- `DRY_RUN` - Set to 'false' to enable actual data creation
- `OUTPUT_DIR` - Directory to store log files and reports
- `AUTH_TOKEN` - Authentication token for TT API

## Results and Logs

All results, logs, and reports will be saved to the `import-results` directory, including:

- `import-results-{date}.json` - Overall results and statistics
- `btc-events-{date}.json` - Raw events data from BTC
- `processed-events-{date}.json` - Successfully processed events
- `failed-events-{date}.json` - Events that failed to import
- `unmatched-entities-{date}.json` - Entities that couldn't be resolved
- `go-nogo-assessment-{date}.json` - Go/No-Go assessment results

## Go/No-Go Assessment

The import process includes a Go/No-Go assessment based on the following thresholds:

- Entity Resolution Rate: ≥ 90%
- Validation Rate: ≥ 95%
- Overall Success Rate: ≥ 85%

## Documentation

For more detailed information about the BTC Event Import project, refer to:

- `PMR_ActualImport.md` - Plan for executing actual imports
- `/public/importingBTC/PMR_BTC_EVENT_Import.md` - Main PMR document
- `/public/importingBTC/PMR_TestRunResults.md` - Dry-run test results
- `/public/importingBTC/PMR_Next_Steps.md` - Planning for subsequent phases

## Related Files

- `/btc-import.js` - Main implementation for single-day imports
- `/entity-resolution.js` - Entity resolution functions
- `/error-handler.js` - Error handling and logging implementation