# PMR_BTC_EVENT_Import Test Run Script

This document provides a guided script for executing the single-day test import, analyzing results, and documenting the outcome.

## Pre-Run Checklist

Before executing the test import, ensure the following prerequisites are met:

```bash
# Pre-Run Checklist Script

#!/bin/bash
echo "========================================"
echo "BTC EVENT Import Test Run Prerequisites"
echo "========================================"

# Check Node.js installation
echo -n "Checking Node.js... "
if command -v node > /dev/null; then
  NODE_VERSION=$(node -v)
  echo "✅ Installed ($NODE_VERSION)"
else
  echo "❌ Not installed"
  echo "Please install Node.js v16 or later"
  exit 1
fi

# Check npm modules
echo -n "Checking required npm modules... "
if node -e "try { require('axios'); console.log('✅ axios installed'); } catch(e) { console.log('❌ axios missing'); process.exit(1); }"; then
  : # Axios is installed
else
  echo "Please install required modules with: npm install axios"
  exit 1
fi

# Check access to BTC API
echo -n "Checking BTC API access... "
BTC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://bostontangocalendar.com/wp-json/tribe/events/v1/events?per_page=1")
if [ "$BTC_STATUS" -eq 200 ]; then
  echo "✅ Accessible"
else
  echo "❌ Not accessible (HTTP $BTC_STATUS)"
  echo "Please verify BTC WordPress site is available"
  exit 1
fi

# Check access to TT API
echo -n "Checking TT API access... "
TT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3010/api/events?appId=1&limit=1")
if [ "$TT_STATUS" -eq 200 ]; then
  echo "✅ Accessible"
else
  echo "❌ Not accessible (HTTP $TT_STATUS)"
  echo "Please ensure TangoTiempo backend is running on port 3010"
  exit 1
fi

# Check authentication token if provided
if [ ! -z "$AUTH_TOKEN" ]; then
  echo -n "Checking authentication token... "
  AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $AUTH_TOKEN" "http://localhost:3010/api/events?appId=1&limit=1")
  if [ "$AUTH_STATUS" -eq 200 ]; then
    echo "✅ Valid"
  else
    echo "❌ Invalid (HTTP $AUTH_STATUS)"
    echo "Please provide a valid authentication token"
    exit 1
  fi
else
  echo "⚠️  No authentication token provided"
  echo "Some operations may fail if authentication is required"
fi

# Create output directory
IMPORT_RESULTS_DIR="import-results"
echo -n "Creating output directory... "
if mkdir -p "$IMPORT_RESULTS_DIR"; then
  echo "✅ Created: $IMPORT_RESULTS_DIR"
else
  echo "❌ Failed to create output directory"
  exit 1
fi

echo -n "Selecting test date... "
TEST_DATE=$(date -v+90d "+%Y-%m-%d" 2>/dev/null || date -d "+90 days" "+%Y-%m-%d" 2>/dev/null)
if [ -z "$TEST_DATE" ]; then
  # Fallback for compatibility
  TEST_DATE=$(node -e "const d=new Date(); d.setDate(d.getDate()+90); console.log(d.toISOString().split('T')[0])")
fi
echo "✅ Selected: $TEST_DATE"

echo "========================================"
echo "Prerequisites check completed successfully!"
echo "Test date: $TEST_DATE"
echo "========================================"
```

## Test Run Process

The test run process consists of the following steps:

1. **Dry Run** - Execute import in dry-run mode to validate without modifying data
2. **Entity Preparation** - Create missing entities identified during dry run
3. **Actual Run** - Execute import with actual data modification
4. **Verification** - Verify imported data integrity
5. **Go/No-Go Assessment** - Evaluate results against criteria

### Step 1: Dry Run

Execute the import in dry-run mode:

```bash
# Set environment variables
export BTC_API_BASE="https://bostontangocalendar.com/wp-json/tribe/events/v1"
export TT_API_BASE="http://localhost:3010/api"
export APP_ID="1"
export TEST_DATE="2025-07-24"  # Use the date selected in pre-run checklist
export DRY_RUN="true"

# Run the import script in dry-run mode
node btc-import.js
```

### Step 2: Entity Preparation

After the dry run, analyze unmatched entities and prepare them:

```bash
# Review unmatched entities
cat import-results/unmatched-entities-$TEST_DATE.json

# Create missing venues in TT (manual process)
# Add btcNiceName to existing organizers (manual process)
# Update category mapping if needed (manual process)

# Run entity preparation script (optional automation)
node entity-preparation.js
```

### Step 3: Actual Run

Execute the import with actual data modification:

```bash
# Set environment variables
export BTC_API_BASE="https://bostontangocalendar.com/wp-json/tribe/events/v1"
export TT_API_BASE="http://localhost:3010/api"
export APP_ID="1"
export TEST_DATE="2025-07-24"  # Use the date selected in pre-run checklist
export DRY_RUN="false"

# Create backup before actual run
echo "Creating backup of events collection..."
mongoexport --db TT_DB --collection events --query '{"appId":"1"}' --out events_pre_test_import.json

# Run the import script
node btc-import.js
```

### Step 4: Verification

Verify the imported data:

```bash
# Run comparison script
node result-comparison.js

# Manual verification in TT admin UI
echo "Please verify imported events in TangoTiempo admin UI:"
echo "1. Open http://localhost:3008/dashboard/events"
echo "2. Filter for events on $TEST_DATE"
echo "3. Verify event details, venues, organizers, and categories"
```

### Step 5: Go/No-Go Assessment

Evaluate the results against criteria:

```bash
# Run assessment script
node go-nogo-assessment.js

# Record results in PMR documentation
echo "Please update the following PMR files with test results:"
echo "1. PMR_BTC_EVENT_Import.md - Update Phase 2 tasks status"
echo "2. PMR_SingleDayTestResults.md - Create with detailed results"
echo "3. PMR_Next_Steps.md - Update with recommendations"
```

## Test Run Analysis Template

Create a detailed analysis of the test run using this template:

```markdown
# PMR_BTC_EVENT_Import Test Results

## Test Configuration
- Test Date: {DATE}
- Environment: {ENVIRONMENT}
- Dry Run: {YES/NO}
- Import Script Version: {VERSION}

## Import Statistics
- BTC Events Total: {COUNT}
- TT Events Created: {COUNT}
- TT Events Failed: {COUNT}
- Entity Resolution Success Rate: {PERCENTAGE}
- Validation Success Rate: {PERCENTAGE}
- Overall Success Rate: {PERCENTAGE}

## Entity Resolution Details
- Venues Matched: {COUNT}/{TOTAL}
- Organizers Matched: {COUNT}/{TOTAL}
- Categories Matched: {COUNT}/{TOTAL}

## Key Issues Identified
1. {ISSUE_1}
2. {ISSUE_2}
3. {ISSUE_3}

## Resolution Actions
1. {ACTION_1}
2. {ACTION_2}
3. {ACTION_3}

## Go/No-Go Assessment
- Assessment Status: {GO/NO-GO}
- Decision Rationale: {RATIONALE}
- Next Steps: {NEXT_STEPS}

## Verification Results
- UI Verification: {PASS/FAIL}
- Data Integrity: {PASS/FAIL}
- Performance Impact: {MINIMAL/MODERATE/SIGNIFICANT}
```

## Error Resolution Guide

Common errors encountered during test import and their resolutions:

### Entity Resolution Errors

1. **Venue Not Found**
   - **Error**: `Venue not found: {venue_name}`
   - **Resolution**: Create the venue in TT with the same name
   - **Prevention**: Update venue names for consistency

2. **Organizer Not Found**
   - **Error**: `Organizer not found: {organizer_name}`
   - **Resolution**: Add `btcNiceName` to existing TT organizer or create new organizer
   - **Prevention**: Maintain organizer mapping table

3. **Category Not Mapped**
   - **Error**: `Category not mapped: {category_name}`
   - **Resolution**: Update `categoryMapping.js` with the missing mapping
   - **Prevention**: Regularly review BTC categories for new additions

### API Errors

1. **Rate Limiting**
   - **Error**: `Rate limit exceeded (429)`
   - **Resolution**: Adjust delay between requests
   - **Prevention**: Use batch processing with appropriate pacing

2. **Authentication Failure**
   - **Error**: `Authentication error (401/403)`
   - **Resolution**: Verify and update authentication token
   - **Prevention**: Implement token refresh mechanism

3. **Server Error**
   - **Error**: `Server error (500)`
   - **Resolution**: Check server logs and restart if necessary
   - **Prevention**: Ensure adequate server resources

### Data Validation Errors

1. **Missing Required Field**
   - **Error**: `Missing required field: {field}`
   - **Resolution**: Update mapping to include required field
   - **Prevention**: Validate schema requirements

2. **Invalid Date Format**
   - **Error**: `Invalid date format for field: {field}`
   - **Resolution**: Fix date conversion logic
   - **Prevention**: Use consistent date handling

3. **Start Date After End Date**
   - **Error**: `Start date is after end date`
   - **Resolution**: Check date parsing and timezone handling
   - **Prevention**: Add validation before import

## Readiness Criteria

The following criteria determine readiness to proceed to Phase 3:

1. **Entity Resolution Rate** ≥ 90%
2. **Validation Success Rate** ≥ 95%
3. **Overall Success Rate** ≥ 85%
4. **No Critical Data Issues** in imported events
5. **Successful UI Verification** of imported events
6. **Minimal Performance Impact** on TT system

If all criteria are met, the Go/No-Go assessment should result in "GO" status, indicating readiness to proceed to Phase 3 (Historical Data Cleanup).

## Documentation Updates

After completing the test run, update the following PMR documentation:

1. **PMR_BTC_EVENT_Import.md**
   - Update Phase 2 task statuses
   - Add notes from test run

2. **PMR_Next_Steps.md**
   - Update based on test results
   - Adjust recommendations for Phase 3

3. **Create PMR_SingleDayTestResults.md**
   - Document detailed test results
   - Include any issues and resolutions