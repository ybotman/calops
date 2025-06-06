# Issue 1038: Organizer Link Modal Name Field Not Displaying Correctly

**Issue ID:** 1038  
**Branch:** issue/1038-organizer-link-modal-name  
**Status:** Fixed  
**Created:** 2025-01-06  
**Type:** Bug  

## Description
In the Organizer Management page, the link modal (Connect Organizer to User) is not displaying the user's name properly. The name field shows empty or incorrect values instead of the actual user name from the UserLogin document.

## Symptoms
- User names appear blank in the dropdown
- Some users show only their email instead of name
- The display logic is not using the correct field priority

## Investigation Notes
- The modal is in `src/components/organizers/OrganizerConnectUserForm.js`
- Current logic tries to build name from firstName/lastName but should prioritize loginUserName
- The getOptionLabel function needs to be updated to match the main grid display logic

## Root Cause
The name display logic in the modal doesn't match the logic used in the main organizer grid, leading to inconsistent display of user names.

## Proposed Solution
Update the getOptionLabel and renderOption functions in OrganizerConnectUserForm to use the same name resolution logic as the main grid:
1. Check localUserInfo.loginUserName first
2. Then firstName/lastName combination
3. Then firebaseUserInfo.displayName
4. Finally fall back to email

## Tasks
- [x] Update getOptionLabel function to use correct field priority
- [x] Update renderOption function to match
- [x] Ensure filter function searches all name fields
- [ ] Test with various user data scenarios

## Resolution
Fixed in the OrganizerConnectUserForm component by aligning the name display logic with the main organizer grid. The getOptionLabel and renderOption functions now use the same priority:
1. localUserInfo.loginUserName
2. firstName + lastName
3. firebaseUserInfo.displayName
4. email as fallback

## Related Files
- `src/components/organizers/OrganizerConnectUserForm.js`
- `src/app/dashboard/organizers/page.js`

## Testing Requirements
- Verify names display correctly in dropdown
- Ensure search/filter works across all name fields
- Test with users having different combinations of name data