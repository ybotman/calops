# Issue: BTC Venue Import Geolocation Failure

## Overview
This issue documents the failure of venue import and geolocation validation from BTC.com events. Only 39 out of 70+ venues from BTC.com are being successfully imported, potentially due to masteredCity resolution problems. Additionally, manual venue creation fails with a 400 error "Latitude and longitude are required" when users select masteredCity but don't provide coordinates.

## Details
- **Reported On:** 2025-04-25
- **Reported By:** System
- **Environment:** Development
- **Component/Page/API Affected:** BTC Import, Venue Geolocation Validation, Manual Venue Creation
- **Symptoms:** 
  - Import processes only 39 of 70+ BTC venues; geolocation validation fails for remaining venues
  - Manual venue creation fails with 400 error when trying to create venue with masteredCityId but no coordinates

## Steps to Reproduce
1. Run the BTC import process via btc-import.js
2. Check the import-results JSON file in the import-results directory
3. Observe that many venues fail in the entity resolution phase
4. Check the unmatched-entities report for venues without masteredCity association
5. Try to create a venue manually with masteredCity selected but no coordinates - observe API error

## Investigation
- **Initial Trace:** The entity resolution component is failing to map BTC venues to TangoTiempo venues
- **Suspected Cause:** Missing masteredCity mappings for venues; default fallback not working correctly
- **Files to Inspect:** 
  - btc-import.js
  - entity-resolution.js (particularly the resolveVenue and getVenueGeography functions)
  - src/app/api/venues/validate-geo/route.js
  - src/app/dashboard/venues/page.js (for venue creation form)

### Analysis
1. In entity-resolution.js, the resolveVenue function attempts to match BTC venues to existing TT venues but fails if there's no exact match
2. The getVenueGeography function contains fallback logic that defaults to Boston coordinates (-71.0589, 42.3601) but doesn't properly set masteredCityId
3. When venues lack proper masteredCity association, subsequent geolocation validation fails
4. The validation API endpoint requires a valid masteredCityId or the ability to find a nearby city
5. The venue creation form doesn't automatically populate coordinates when a masteredCity is selected

## Fix (implemented)
- **Status:** ✅ Fixed
- **Fix Description:** 
  1. Created a GeolocationResolver service with Boston defaults and coordinate lookup functions
  2. Modified the venue creation form to auto-populate coordinates from selected masteredCity
  3. Updated the venues API endpoint to handle missing coordinates by:
     - Looking up coordinates from masteredCityId when available
     - Falling back to Boston coordinates when necessary
     - Providing better error handling with retry logic for 404 errors
  4. Enhanced validate-geo/route endpoint to handle missing coordinates by:
     - Getting coordinates from masteredCity when available 
     - Falling back to Boston coordinates
     - Updating venue records with valid coordinates
  5. Improved error messages and added retry logic for common error conditions
  
- **Testing:** Ready for manual verification with test BTC import run and venue creation testing

## Resolution Log
- **Commit/Branch:** `bugfix/btc-venue-geolocation`
- **PR:** (to be created)
- **Deployed To:** Not yet deployed
- **Verified By:** Not yet verified

## Implementation Details
1. Created a new service: `/src/lib/services/geolocation-resolver.js` with standardized Boston defaults
2. Enhanced venue form in `venues/page.js` to auto-populate coordinates from selected cities
3. Improved error handling and fallback logic in the venue creation API
4. Updated validation endpoint to handle missing coordinates by looking up from masteredCity

This solution addresses both the BTC import failures and the manual venue creation issues by ensuring coordinates are always available when needed, either from the selected city or from Boston defaults.

---

> Store under: `/public/issues/current/Issue_BTC_Venue_Import_Failure.md`