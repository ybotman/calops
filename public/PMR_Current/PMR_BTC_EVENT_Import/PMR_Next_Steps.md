# PMR_BTC_EVENT_Import: Next Steps

## Current Status Summary
As of 2025-04-24, we have initialized the Boston Tango Calendar (BTC) Event Import PMR. Currently:

🚧 **In Progress:**
- Initial documentation and planning (Phase 1)
- Designing data mapping strategy (Phase 1)
- Defining entity resolution approach (Phase 1)

⏳ **Pending:**
- API verification and testing (Phase 1)
- Single-day test import development (Phase 2)
- Historical data cleanup planning (Phase 3)
- Daily import implementation (Phase 4)
- Production deployment preparation (Phase 5)

## Recommended Next Actions

### 1. Complete Phase 1: Design and Mapping Development
The immediate focus is on completing the design and mapping strategy:

- **Verify WordPress API Access**
  - Test API endpoint: `wp-json/tribe/events/v1/events`
  - Document response format and fields
  - Identify any rate limiting or access constraints

- **Finalize Field Mapping Documentation**
  - Review and validate the initial mapping outlined in PMR_Data_Mapping.md
  - Identify any missing fields or edge cases
  - Document transformation rules for each field

- **Develop Entity Resolution Strategy**
  - Create test queries for venue lookup by name
  - Develop organizer matching logic
  - Finalize category mapping implementation
  - Plan for handling unmatched entities

- **Error Handling Design**
  - Define error categories and logging approach
  - Create strategy for manual intervention points
  - Design verification steps for each import stage

- **Date/Time Standardization**
  - Establish Zulu/UTC conversion procedures
  - Document timezone handling for event start/end times
  - Test date format conversion functions

### 2. Prepare for Phase 2: Single-Day Test Import
After completing Phase 1, prepare for the test import:

- **Select Test Date**
  - Choose a date approximately 90 days in the future
  - Ensure sufficient events exist for this date in BTC
  - Verify TT can handle similar events

- **Develop Test Import Script**
  - Create initial Node.js script structure
  - Implement BTC API client functions
  - Develop TT API client functions
  - Build mapping logic based on Phase 1 design

- **Setup Verification Process**
  - Create validation checks for imported data
  - Develop comparison tools for source vs. imported data
  - Design error reporting format

### 3. Technical Implementation Plan
Develop the technical approach for implementation:

- **Script Architecture**
  - Design modular functions for each import stage
  - Create configuration file structure
  - Implement logging framework
  - Develop retry and error handling mechanisms

- **Entity Resolution Implementation**
  - Code venue lookup function with fuzzy matching capability
  - Implement organizer name resolution
  - Create category mapping using the existing categoryMapping.js
  - Add manual override capability for edge cases

- **Data Validation**
  - Implement schema validation for mapped events
  - Create data quality checks
  - Design exception reporting format

## Technical Considerations

### For Phase 1 (Design)
- Review existing TT event schema to ensure all required fields are covered
- Consider handling of recurring events if present in BTC
- Document any fields that may require special handling or transformation

### For Phase 2 (Test Import)
- Implement dry-run capability to validate mappings without writing data
- Create detailed logs of all mapping decisions for review
- Develop robust error handling for API failures

### For Phases 3-5
- Design backup procedures before any production data modification
- Implement progressive validation at each step
- Create monitoring tools for the import process
- Design rollback capability for each stage

## Timeline
- Phase 1 Completion: 2025-04-30 (Target)
- Phase 2 Completion: 2025-05-07 (Target)
- Phase 3 Completion: 2025-05-14 (Target)
- Phase 4 Completion: 2025-05-21 (Target)
- Phase 5 Completion: 2025-05-28 (Target)
- Final Testing: 2025-05-29
- Production Deployment: 2025-05-31

## Dependencies
- Stable access to WordPress BTC API
- Consistent TT API endpoints for venues, organizers, and categories
- MongoDB instance with sufficient capacity
- Node.js runtime environment

## Resources Needed
- Access to both BTC WordPress and TT development environments
- Test data sets for venue, organizer, and category mapping
- MongoDB backup capabilities for rollback procedures