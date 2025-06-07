# Issue 1045: Organizer Connected Users Display Names

## Status: 🚧 In Progress

## Summary
In the Organizer Management edit form, the connected users and alternate Firebase users are displayed as Firebase IDs. We need to display the actual userLogin names instead of Firebase IDs for better usability.

## Problem Description
1. The current implementation shows firebaseUserId and altFirebaseUserId as raw IDs
2. Users need to see the actual userLogin names to identify connected users
3. The isRendered column should be removed (keeping only wantRender)
4. Consider combining firebaseUserId and altFirebaseUserId into one comprehensive connected users list

## Steps to Reproduce
1. Navigate to Organizer Management page
2. Click edit on any organizer
3. Observe the Connected Users section shows Firebase IDs instead of user names
4. The alternate Firebase users (if any) also show as IDs

## Expected Behavior
- Display userLogin names instead of Firebase IDs
- Either combine firebaseUserId and altFirebaseUserId into one list OR show names in both columns
- Remove the isRendered column
- Keep the wantRender column

## Current Investigation

### Files Involved
- `/src/components/organizers/OrganizerEditForm.js` - Main edit form component
- `/src/lib/api-client/users.js` - API client for user operations
- `/src/components/organizers/OrganizerConnectUserForm.js` - User connection form

### Technical Details
The current implementation retrieves Firebase IDs but doesn't resolve them to user names. The system needs to:
1. Fetch user details for all connected Firebase IDs (both primary and alternate)
2. Map Firebase IDs to userLogin names for display
3. Handle cases where user details might not be available

### Related Error Found
During investigation, discovered that `updateAlternateFirebaseIds` function call was failing with:
```
Error updating alternate Firebase IDs: TypeError: k.g8.updateAlternateFirebaseIds is not a function
```
This appears to be a module caching issue in the Next.js development environment.

## Implementation Requirements

### Backend Requirements
- Ensure `/api/userlogins/:firebaseId/alternate-ids` endpoint is properly accessible
- Verify the endpoint returns user details including userLogin names

### Frontend Requirements
1. Modify OrganizerEditForm to fetch user details for all Firebase IDs
2. Create a mapping function to resolve Firebase IDs to userLogin names
3. Update the display table to show userLogin instead of Firebase IDs
4. Remove the isRendered column from the display
5. Consider creating a unified "Connected Users" view that combines:
   - Primary firebaseUserId
   - All altFirebaseUserIds
   - Display format: "userLogin (primary)" or "userLogin (alternate)"

### UI/UX Considerations
- Show loading state while fetching user names
- Handle cases where user details cannot be fetched (show Firebase ID as fallback)
- Consider adding tooltips to show Firebase IDs on hover for technical reference

## KANBAN
- Created: 2025-01-06
- Author: AI Assistant
- Priority: Medium
- Component: Organizer Management
- Type: UI Enhancement
- Branch: To be created from DEVL as `issue/1045-organizer-connected-users-display-names`

## SCOUT
- Investigated current implementation in OrganizerEditForm.js
- Found firebaseUserId and altFirebaseUserId display logic
- Identified need to fetch user details for display names
- Module caching issue discovered with updateAlternateFirebaseIds function
- Backend endpoint exists at `/api/userlogins/:firebaseId/alternate-ids`

## BUILDER
- [ ] Create helper function to batch fetch user details by Firebase IDs
- [ ] Update OrganizerEditForm to use the helper function
- [ ] Modify the connected users table to display userLogin names
- [ ] Remove isRendered column from the table
- [ ] Implement fallback display for users without resolved names
- [ ] Test with organizers having multiple connected users
- [ ] Ensure alternate Firebase IDs are properly displayed
- [ ] Add loading states for user name resolution

## Testing Checklist
- [ ] Test with organizer having no connected users
- [ ] Test with organizer having only primary Firebase user
- [ ] Test with organizer having alternate Firebase users
- [ ] Test when some user details cannot be fetched
- [ ] Verify isRendered column is removed
- [ ] Verify wantRender column remains functional

## Resolution Log
- 2025-01-06: Issue created and investigation completed
- 2025-01-06: Module caching issue identified in OrganizerConnectUserForm
- 2025-01-06: Issue documentation completed