# PMR: Events Import from WordPress (BostonTangoCalendar.com)

## Overview
This PMR outlines the phased migration plan to import events from the legacy WordPress site (bostontangocalendar.com) powered by The Events Calendar (TEC) plugin into TangoTiempo.com (TT). The goal is to replace current events with fresh data sourced from WordPress, using a structured, phased import process for stability.

While we will do this many time to load data from Dev and Test, working out the kinks on lots of other area, We will do this in PROD only once at cut over.

## Assumptions
- Data is retrieved using the TEC REST API: `wp-json/tribe/events/v1/events?start_date=...`
- TT events are stored in a MongoDB collection associated with a specific `appId =1' .
- Current TT data prior to the 1st of the current month can be deleted safely.

### Lookup Mappings:
1. **Venue Lookup**  
   - **Source**: `venue.venue` field in BTC REST event results.  
   - **Lookup**: Match via TT.com Venue API using `name`.  
   - **Target Fields** in TT.com Event Collection: `X1`, `X2` (or `X1`, `X2` per schema).

2. **Organizer Lookup**  
   - **Source**: `organizer` field from BTC events (e.g., "Nam Nguyen").  
   - **Lookup**: Match against TT.com Organizer API on `organizer.name`.  
   - **Target Field** in TT.com Event Collection: `organizerId` (or reference field per schema).

3. **Category Lookup**  
   - **Source**: Category strings in BTC events.  
   - **Lookup**: Mapping file located at `/public/importingBTC/categoryMapping.js` using `categoryNameMap`.  
     ```js
     export const categoryNameMap = {
       "Class": "Class",
       "Drop-in Class": "Class",
       ...
     }
     ```
   - **Target Field** in TT.com Event Collection: `categoryId` or `categoryName` (as defined in schema).

---

## Phase 1: Build out design, mapping, logic, threasohold for the loading process. 
 - verify BTC data (test with 1 or 2 sample days) and attributes
 - verify mappings to Target EVENTs collection needs
 - verify lookup needs for the (Venues, organziers, Categories) for api,
 - finalize mappings look logic and error hading.
 - make sure we are talking about startDate day based on zulu.
 
## Phase 2: Do 1 day 'Day x' 90 days in the future.
- Get the all the BTC events for that day
- Do all necessary TT lookups from source data, and prep the days x output to load to TT.events
- Go/Nogo assement 
- Delete events on 'Day x' in TT
- insert day x into TT
- verify results and errors
- docuement the ready ness for phase 3,4.

## Phase 3: Old Data Purge
**Goal:** Clean up outdated event data.

### Actions:
- Delete all TT events prior to the 1st of the current month.
- Scope the deletion to the relevant `appId` for TangoTiempo.com.

**Test Criteria:**
- Confirm deletion via count queries before/after.
- Ensure events from the 1st of the current month onward remain untouched.
---

## Phase 4: Daily Import Loop.
**Goal:** Import all events for the selected day. (Pull data, Lookup, Check/Verify. Go-NoGo, Delete 1 day, load 1 day, Error loging, and loop)

### Actions:
1. For each day to the end:
   - Fetch events from WordPress API for that date.
   - For each event:
     - Match Organizer, Category, and Venue using lookup strategies above.
     - If all matches are found 
       - Delete any TT events on the same date for the same Organizer+Venue+Category.
       - Insert the new event.

**Test Criteria:**
- Data appears in TT admin UI.
- Matches follow expected Organizer/Venue/Category.
- No duplicates from re-run.

---

---

## File Paths
- Markdown file: `/public/PMR_Current/?.md`
- Once completed: `/public/PMR_Completed/ ?.md`

---

## Related PMRs
- Check `/localhost:3001/public/PMR_*.md` for other active TT PMRs.

## Notes
- Ensure use of ISO date format for API calls.
- Add error handling for no match on Organizer/Venue/Category.
- Consider logging failed imports for manual reconciliation.
- you have access to ALL the backend server code (serverX.js models and api, etc ) at ./be-info/....

## success critera
- to load a claim fields 'x,y,z' need to be mapped and have values.
 - xx

