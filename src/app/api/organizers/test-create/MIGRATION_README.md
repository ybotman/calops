# BTC Organizer Migration API

## Overview

This endpoint (`/api/organizers/test-create`) is a specialized route designed specifically for importing organizer data from BostonTangoCalendar (BTC) WordPress API into our system. It is **not** intended for regular organizer creation and should only be used during the one-time data migration process.

## Purpose

The endpoint serves as a bridge between BTC's data structure and our application's schema requirements by:

1. Fetching required MongoDB ObjectIDs for:
   - `linkedUserLogin` (from existing users)
   - `organizerRegion` (targeting "Northeast" region)
   - `organizerDivision` (targeting "New England" division)
   - `organizerCity` (targeting "Boston" city)

2. Transforming BTC organizer data format to match our schema
3. Handling validation and error reporting during the import process

## Implementation Details

- **Two-step process**:
  1. First fetches necessary IDs from our system
  2. Then creates organizers with these IDs plus BTC data

- **Geo-hierarchy mapping**:
  - Attempts to match BTC organizers to our geographical hierarchy
  - Falls back to any valid region if specific regions aren't found

- **Image handling**:
  - Preserves image URLs from BTC when available

## Technical Considerations

This approach was chosen for pragmatic reasons:

- **Expedient solution** for one-time data migration without requiring backend changes
- **Isolated impact** as it's contained in its own endpoint
- **Temporary usage** limited to the initial data import

## Future Recommendations

After completing the migration:

1. This endpoint should be deprecated or removed
2. For future imports, consider implementing a proper import utility in the backend
3. Any similar functionality should be integrated into the main organizer creation flow

## Usage Notes

The endpoint is called by the organizer import functionality in the admin dashboard and should not be used directly. It expects transformed BTC organizer data and returns either:

- A 201 success response with the created organizer data
- A detailed error response explaining validation or processing failures

This documentation serves as a record of the migration process for future reference.