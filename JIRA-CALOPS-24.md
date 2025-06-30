# CALOPS-24: Venue Management Filtering Enhancements

## Summary
Enhance the venue management interface with geographic filtering capabilities and approval status management.

## Description
The venue management page needs improvements to handle large numbers of venues more effectively. This includes filtering by geographic hierarchy (division/city) and separating venues by approval status.

## Acceptance Criteria
- [x] Users can filter venues by Division (masteredDivisionID)
- [x] When a division is selected, users can further filter by City (masterCityID) 
- [x] City dropdown only shows cities within the selected division
- [x] Replace "Validated/Invalid Geo" tabs with "Approved/Not Approved" tabs
- [x] "Approved" tab shows venues where isApproved = true
- [x] "Not Approved" tab shows venues where isApproved = false or null
- [x] Venue rows are more compact to fit more venues on screen
- [x] Edit venue dialog includes isActive and isApproved toggle switches
- [x] isActive column removed from venue list display (but available in edit)

## Technical Implementation
- Updated VenuesPageContainer to manage division/city filter state
- Modified useVenueFilter hook to filter by isApproved field instead of hasValidGeo
- Added density prop support to VenueTable component
- Updated VenuesPage component to include filter dropdowns in UI
- Cities are filtered based on selected division for better UX

## Testing Notes
1. Verify division dropdown shows all active divisions
2. Verify city dropdown only appears when division is selected
3. Verify city dropdown only shows cities for selected division
4. Verify Approved tab shows only approved venues
5. Verify Not Approved tab shows only non-approved venues
6. Verify venue edit dialog has working isActive/isApproved toggles
7. Verify compact row display fits more venues on screen

## Related Issues
- Follows up on venue management discussed in TEST branch
- Related to geographic hierarchy management system