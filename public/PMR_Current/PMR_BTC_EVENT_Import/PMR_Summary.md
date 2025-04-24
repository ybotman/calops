# PMR_BTC_EVENT_Import Summary

## What is being migrated?
This migration involves importing event data from the legacy WordPress-based Boston Tango Calendar (BTC) site into the new TangoTiempo.com (TT) platform. The WordPress site uses The Events Calendar plugin which provides a REST API that serves as our data source.

## Why is this migration necessary?
The transition from the WordPress platform to the new TangoTiempo system requires data continuity to ensure users have access to historical events and upcoming scheduled activities without interruption. This migration is essential for maintaining the calendar's value during the platform transition.

## Key Components
1. **Data Extraction** - Using WordPress TEC REST API
2. **Data Mapping** - Translating between WordPress and TangoTiempo schemas
3. **Entity Resolution** - Matching venues, organizers, and categories
4. **Incremental Import** - Day-by-day processing of events
5. **Data Validation** - Ensuring complete and accurate transfers

## Timeline
- Phase 1 (Design): In progress
- Phase 2 (Test Import): Scheduled after design completion
- Phase 3 (Data Cleanup): Pending successful test
- Phase 4 (Daily Import): To follow cleanup
- Phase 5 (Production Cutover): Final step

## Current Status
The migration is in the initial planning and design phase. We are developing and documenting the mapping processes, lookup strategies, and import procedure that will be used for the migration.

## Next Steps
1. Complete data mapping documentation
2. Verify API access and response format
3. Develop lookup mechanisms for related entities
4. Prepare for single-day test import