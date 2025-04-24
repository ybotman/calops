# PMR_BTC_EVENT_Import Approach

## Migration Methodology

This document outlines the approach for migrating events from the Boston Tango Calendar WordPress site to TangoTiempo.com. We've designed a methodical, phased approach to ensure data integrity and minimize disruption.

### Core Principles

1. **Incremental Migration** - Process events one day at a time to manage complexity
2. **Validation First** - Test and validate before modifying production data
3. **Entity Resolution** - Ensure proper mapping of related objects (venues, organizers)
4. **Data Integrity** - Maintain consistent data quality throughout the process
5. **Rollback Capability** - Ensure ability to revert if issues arise

## Technical Approach

### Data Extraction Strategy

The WordPress site uses The Events Calendar (TEC) plugin which provides a REST API endpoint:
```
wp-json/tribe/events/v1/events?start_date=YYYY-MM-DD
```

We will:
1. Request events day-by-day to manage API call volume
2. Store the raw data temporarily for processing
3. Parse and transform as needed for import

### Mapping Process

The mapping process involves several key steps:

1. **Schema Translation**
   - Map WordPress event fields to TangoTiempo event fields
   - Handle any structural differences between systems
   - Standardize date/time values to UTC/Zulu time

2. **Entity Resolution**
   - Venues: Match BTC venue names with TT venue records
   - Organizers: Map BTC organizer names to TT organizer records
   - Categories: Use mapping file to translate BTC categories to TT categories

3. **Data Enrichment**
   - Ensure all required TT fields have values
   - Generate any derived fields needed
   - Set required metadata (appId, status, etc.)

### Import Process Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Extract from   │     │ Map entities and │     │  Delete target  │
│   WordPress     │────▶│     fields      │────▶│  day's events   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Verify import  │     │ Insert new data │     │  Log results    │
│    success      │◀────│   for the day   │◀────│  and errors     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Error Handling Strategy

For each type of potential error:

1. **API Access Failures**
   - Retry with exponential backoff
   - Log failures after retry limit
   - Continue with next date if possible

2. **Entity Matching Failures**
   - Log unmatched entities
   - Create exception reports for manual resolution
   - Skip import of events with critical matching failures

3. **Data Validation Failures**
   - Log validation errors
   - Skip invalid records
   - Provide reports for manual review

## Technical Implementation

The import will be implemented as:

- A Node.js script using the MongoDB driver
- Deployed within the existing application environment
- Configured to run on-demand or scheduled

The script will maintain detailed logs of:
- Events processed
- Entity matching statistics
- Errors and exceptions
- Timing and performance metrics

## Verification Methodology

Each phase includes verification steps:

1. **Pre-import Verification**
   - Confirm source data availability
   - Validate mapping configurations
   - Test entity resolution logic

2. **Per-day Verification**
   - Compare source and target event counts
   - Validate critical fields (dates, titles, associations)
   - Check for duplicate prevention

3. **Post-import Verification**
   - UI testing of imported events
   - Search and filter functionality
   - Organizer and venue associations

## Risk Management

The approach incorporates several risk management features:

1. **Phased Implementation** - Breaking the process into distinct phases
2. **Day-by-day Processing** - Limiting the scope of any potential issues
3. **Backups** - Creating data backups before destructive operations
4. **Validation** - Testing entity resolution before processing
5. **Logging** - Detailed audit trail of all actions and errors