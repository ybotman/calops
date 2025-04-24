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
- Phase 1 (Design): ✅ Completed on 2025-04-24
- Phase 2 (Test Import): 🚧 In progress - Implementation complete, testing pending
- Phase 3 (Data Cleanup): Scheduled for 2025-05-14
- Phase 4 (Daily Import): Scheduled for 2025-05-21
- Phase 5 (Production Cutover): Scheduled for 2025-05-28

## Current Status
We have completed Phase 1 (Design and Mapping Development) and the implementation portion of Phase 2 (Single-Day Test Import). Phase 1 delivered all planned design components including entity resolution functions, API documentation, and error handling architecture. For Phase 2, we have developed the complete implementation for the single-day test import, including the import script, test process, and verification tools.

The next steps involve executing the test import, analyzing results, and conducting a Go/No-Go assessment for proceeding to Phase 3.

## Key Achievements
1. **Entity Resolution System** - Created comprehensive system for resolving entities between BTC and TT
2. **Data Mapping Framework** - Developed detailed field mapping with validation
3. **Error Handling Architecture** - Implemented robust error handling with retry mechanisms
4. **API Documentation** - Documented both systems' APIs with detailed formats
5. **Import Process Implementation** - Developed end-to-end import script with testing capabilities

## Next Steps
1. Execute test import in dry-run mode
2. Prepare entities based on mapping verification
3. Run actual test import for selected date
4. Conduct Go/No-Go assessment for Phase 3
5. Document test results and readiness assessment