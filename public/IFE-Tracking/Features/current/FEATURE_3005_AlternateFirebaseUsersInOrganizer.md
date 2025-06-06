# Feature 3005: Add Alternate Firebase Users Multi-Select in Organizer Link Modal

**Feature ID:** 3005  
**Branch:** feature/3005-organizer-alternate-firebase-users  
**Status:** Implemented  
**Created:** 2025-01-06  
**Type:** Enhancement  

## Description
Add a multi-select field to the Organizer Link Modal that allows selecting alternate Firebase users to be associated with an organizer. This leverages the existing alternateFirebaseUserIds array field in the UserLogins model.

## Objectives
1. Keep the existing single user selection as the primary linkedUserLogin
2. Add a multi-select field for alternate Firebase users
3. Store selected Firebase user IDs in the UserLogin's alternateFirebaseUserIds array
4. Display user names in the UI while storing Firebase IDs in the backend
5. Pre-populate the list when editing an existing connection

## Technical Details

### UI Changes
- Add a new multi-select Autocomplete component below the primary user selection
- Label: "Alternate Users (Optional)"
- Allow selecting multiple users from the same user list
- Exclude the primary selected user from alternate selection
- Display user names but store Firebase IDs

### Data Flow
1. When users are selected in the multi-select:
   - Extract their firebaseUserId values
   - Store in the linked UserLogin's alternateFirebaseUserIds array
2. When opening the modal:
   - Load existing alternateFirebaseUserIds
   - Map them back to user objects for display

### API Integration
- Use existing endpoint: `PUT /api/userlogins/:firebaseId/alternate-ids`
- Update the UserLogin document with the selected alternate Firebase IDs

## Components to Modify
1. `OrganizerConnectUserForm.js`:
   - Add multi-select Autocomplete for alternate users
   - Handle loading/saving alternate IDs
   - Filter out primary user from alternate selection
   
2. Backend integration:
   - Ensure alternateFirebaseUserIds array is properly saved
   - Handle the mapping between organizer and multiple Firebase IDs

## Success Criteria
- [x] Multi-select field added to modal
- [x] Can select multiple alternate users
- [x] Primary user excluded from alternate selection
- [x] Alternate IDs saved to UserLogin document
- [x] Pre-populates on edit
- [x] Shows user names while storing Firebase IDs
- [x] Existing single-select functionality unchanged

## Implementation Details
- Added `alternateUsers` state to track selected alternate users
- Multi-select Autocomplete appears after primary user is selected
- Filters out the primary user from alternate selection options
- On mount, loads existing alternateFirebaseUserIds and maps to user objects
- On submit, extracts firebaseUserId from selected users and calls updateAlternateFirebaseIds API
- Added `updateAlternateFirebaseIds` method to users API client
- Uses same name display logic as Issue 1038 fix

## Use Cases
1. Organization has multiple people who can manage the same organizer account
2. User has multiple Firebase accounts (different auth providers)
3. Temporary access for assistants or substitutes
4. Migration scenarios where users transition between accounts

## Testing Requirements
- Select and save alternate users
- Verify data persistence
- Ensure primary user can't be selected as alternate
- Test with users having no name (email only)
- Verify pre-population on edit