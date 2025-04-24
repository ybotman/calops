# PMR_BTC_EVENT_Import

## Summary
This PMR outlines the phased migration plan to import events from the legacy WordPress site (bostontangocalendar.com) powered by The Events Calendar (TEC) plugin into TangoTiempo.com (TT). The goal is to replace current events with fresh data sourced from WordPress, using a structured, phased import process for stability.

## Scope
### Inclusions
- Events data import from WordPress BTC site to TangoTiempo.com
- Mapping of categories, venues, and organizers between systems
- Deletion of outdated events prior to the migration
- Process for incremental daily imports

### Exclusions
- No modifications to the WordPress source system
- No changes to the TangoTiempo.com event schema
- No import of user accounts or authentication data
- No import of media assets (images, attachments)

## Motivation
This migration addresses the need to consolidate event data from the legacy Boston Tango Calendar system into the new TangoTiempo platform to maintain data continuity and provide users with access to historical and upcoming events during the platform transition.

## Changes
- **Backend:** Creating import scripts that fetch from WordPress REST API and insert into MongoDB
- **Data:** Mapping fields between WordPress event format and TangoTiempo schema
- **Admin:** Adding import management tools to monitor progress and handle exceptions

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| API rate limits on WordPress | Implement batch processing with delays between requests |
| Data mapping failures | Create validation reporting with manual review capability |
| Duplicate events | Implement detection and cleanup procedures pre-import |
| Data loss during event deletion | Backup TT event collection before purging old events |
| Timestamp/timezone inconsistencies | Normalize all dates to UTC during import process |

## Rollback Strategy
If rollback is required, restore from the pre-migration event collection backup. The backup should be taken immediately before Phase 3 (Old Data Purge).

```
// Backup steps before migration
mongoexport --db TT_DB --collection events --query '{"appId":1}' --out events_pre_migration.json

// Rollback command if needed
mongoimport --db TT_DB --collection events --file events_pre_migration.json
```

## Dependencies
- WordPress REST API endpoint: `wp-json/tribe/events/v1/events`
- TangoTiempo.com API endpoints for venues, organizers, and categories
- Category mapping configuration file: `/public/importingBTC/categoryMapping.js`
- MongoDB instance for TangoTiempo.com

## Linked PMRs
- No direct dependencies on other PMRs

## Owner
- TangoTiempo.com Technical Team

## Timeline
- Start: 2025-04-24
- Deploy: TBD
- Final Review: TBD

## Post-Migration Tasks
- Review import logs for any failed mappings
- Verify all imported events display correctly on TangoTiempo.com
- Monitor system performance after import completion
- Archive WordPress data for historical reference

# Phase 1: Design and Mapping Development
 
### Goals
Design the data mapping process between BTC WordPress and TangoTiempo, validate data access, and finalize the import strategy.

### Tasks
| Status | Task | Last Updated |
|--------|------|--------------|
| ⏳ Pending | Verify BTC WordPress API access and event structure | 2025-04-24 |
| ⏳ Pending | Document field mapping between BTC and TT schemas | 2025-04-24 |
| ⏳ Pending | Develop lookup strategy for venues, organizers, and categories | 2025-04-24 |
| ⏳ Pending | Create error handling procedures for failed lookups | 2025-04-24 |
| ⏳ Pending | Establish date handling standards (UTC/Zulu) | 2025-04-24 |

### Rollback (if needed)
No production changes in this phase; no rollback required.

### Notes
This phase focuses on planning and validation without modifying production data.

# Phase 2: Single-Day Test Import

### Goals
Validate the import process by testing with a single future date to verify mappings and processes work correctly.

### Tasks
| Status | Task | Last Updated |
|--------|------|--------------|
| ⏳ Pending | Select test date (90 days in future) | 2025-04-24 |
| ⏳ Pending | Fetch all BTC events for test date | 2025-04-24 |
| ⏳ Pending | Perform TT lookups from test data | 2025-04-24 |
| ⏳ Pending | Execute Go/No-Go assessment | 2025-04-24 |
| ⏳ Pending | Delete events on test date in TT | 2025-04-24 |
| ⏳ Pending | Insert mapped events for test date | 2025-04-24 |
| ⏳ Pending | Verify results and document any errors | 2025-04-24 |
| ⏳ Pending | Document readiness assessment for subsequent phases | 2025-04-24 |

### Rollback (if needed)
If test import fails:
1. Delete all events created during test for the selected date
2. Restore any deleted events from backup if needed

### Notes
This phase is critical for validating the entire process flow in a controlled manner.

# Phase 3: Historical Data Cleanup

### Goals
Safely remove outdated events to prepare for the bulk import of new data.

### Tasks
| Status | Task | Last Updated |
|--------|------|--------------|
| ⏳ Pending | Create backup of events collection | 2025-04-24 |
| ⏳ Pending | Query count of events prior to current month | 2025-04-24 |
| ⏳ Pending | Execute deletion of events prior to current month | 2025-04-24 |
| ⏳ Pending | Verify deletion success via count queries | 2025-04-24 |
| ⏳ Pending | Confirm events from current month forward remain intact | 2025-04-24 |

### Rollback (if needed)
If deletion affects incorrect data:
1. Restore events collection from backup
2. Document issues that caused the incorrect deletion

### Notes
Deletion is scoped only to events with appId=1 (TangoTiempo.com) and dates prior to the 1st of the current month.

# Phase 4: Daily Import Implementation

### Goals
Implement the day-by-day import process to systematically import all events from BTC to TT.

### Tasks
| Status | Task | Last Updated |
|--------|------|--------------|
| ⏳ Pending | Create daily import loop script | 2025-04-24 |
| ⏳ Pending | Implement per-day fetching from WordPress API | 2025-04-24 |
| ⏳ Pending | Build matching logic for organizers, venues, categories | 2025-04-24 |
| ⏳ Pending | Develop per-day deletion and insertion process | 2025-04-24 |
| ⏳ Pending | Add comprehensive error logging | 2025-04-24 |
| ⏳ Pending | Test with multiple consecutive days | 2025-04-24 |
| ⏳ Pending | Verify data integrity in TT admin UI | 2025-04-24 |
| ⏳ Pending | Confirm no duplicates occur on re-runs | 2025-04-24 |

### Rollback (if needed)
If import process fails during execution:
1. Stop the import process
2. Identify the last successfully processed day
3. Restore data for the failed day from backup if available
4. Address the cause of failure before resuming

### Notes
The import process is designed to be idempotent - running it multiple times for the same date should not create duplicates.

# Phase 5: Production Deployment and Cutover

### Goals
Execute the final import process in production to complete the migration from BTC to TT.

### Tasks
| Status | Task | Last Updated |
|--------|------|--------------|
| ⏳ Pending | Schedule maintenance window for production cutover | 2025-04-24 |
| ⏳ Pending | Create final backup of production events | 2025-04-24 |
| ⏳ Pending | Execute historical data cleanup in production | 2025-04-24 |
| ⏳ Pending | Run daily import process for all target dates | 2025-04-24 |
| ⏳ Pending | Verify data completeness and integrity | 2025-04-24 |
| ⏳ Pending | Perform user acceptance testing | 2025-04-24 |
| ⏳ Pending | Document final migration results and statistics | 2025-04-24 |

### Rollback (if needed)
Complete rollback procedure:
1. Restore events collection from pre-migration backup
2. Notify all stakeholders of rollback
3. Document reasons for rollback and plan remediation

### Notes
This is a one-time production migration - all previous testing should minimize risk during this phase.

## Success Criteria
The migration will be considered successful when:
- All events from BTC are successfully imported into TT
- Required fields are properly mapped with valid values:
  - Event title, description, dates, times
  - Venue with correct location information
  - Organizer properly linked
  - Category correctly mapped
- No data loss occurs during the migration
- Users can view all imported events in the TT interface
- Event search and filtering works correctly with imported data