# Issue: 1025 - BTC Import Robustness Enhancement

## Overview
The BTC venue import process has been partially fixed, but still shows inconsistent behavior with venue matching, geolocation resolution, and error reporting. Multiple specific patterns of failures have been identified including duplicate detection, geocoding fallbacks, and masteredCity resolution. The import statistics also appear to be inconsistent with the actual import results.

## Details
- **Date Reported**: April 25, 2025
- **Reporter**: System Admin
- **Environment**: Production
- **Status**: 🔴 Open

## Reproduction Steps
1. Run BTC import with a selection of 71 venues
2. Observe that many venues are marked as duplicates and skipped
3. Notice some venues fall back to default coordinates and encounter 409 conflicts
4. See venues with missing masteredCity IDs consistently fail with 404 errors
5. Final statistics show 0 imported/failed/skipped despite logs showing successful imports

## Investigation Notes

### Error Patterns Identified
1. **Bulk "No Nearest City" & Duplicate Skips**
   - Venues sharing default coordinates [42.3601, -71.0589] are being skipped
   - Log patterns: "No nearest city found" → "Skipping duplicate venue"
   - These represent venues already present or unresolvable

2. **Default-Coordinate Fallbacks & 409 Conflicts**
   - Venues like "Elliot in Brattoboro, VT" fall back to default VT coords
   - POST requests yield 409 "Duplicate venue within 100 meters"
   - System correctly identifies these as likely duplicates

3. **Repeated 404 Failures & Retry Attempts**
   - Multiple venues follow pattern: No nearest city → set defaults → 404 error
   - Retry with modified payload still results in 404
   - Common error: "No city found" or "Provided masteredCityId not found"

4. **Statistics Inconsistency**
   - Final summary shows zeros despite logs of successful imports
   - Mismatch between logging and counter tracking

## Fix Status
- 🛠️ **Fix In Progress**: The previous fix addressed some geolocation issues but further robustness is needed
- 📋 **Priority**: Medium - Import functionality works manually but automated process needs enhancement

## Required Changes
1. Improve duplicate detection logic to reduce unnecessary API calls
2. Fix statistics tracking to properly count successes, failures, and skips
3. Enhance fallback geocoding with more intelligent defaults
4. Implement better error recovery for 404 masteredCity issues
5. Add detailed reporting for import results

## Resolution Log
- [TO BE COMPLETED AFTER FIX]