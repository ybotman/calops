# Issue 1036: Organizer Edit Form Fixes

## Issue Details
- **Issue ID**: 1036
- **Type**: Bug/Enhancement
- **Priority**: High
- **Status**: 🚧 In Progress
- **Created**: 2025-01-06
- **Reporter**: tobybalsley
- **Assignee**: Claude (SCOUT)

## Description
The Organizer Edit form has multiple issues that need to be addressed:

1. **Remove Active flag** - This will become programmatic/process-driven
2. **Approved and Enabled flags not updating** - Changes to these boolean fields are not being saved
3. **Contact information not updating** - Email and other contact fields are not being saved
4. **Missing organizerTypes controls** - Need UI controls for:
   - isEventOrganizer (locked to true, cannot be changed to false)
   - isVenue
   - isTeacher
   - isMaestro
   - isDJ
   - isOrchestra

## Current Behavior
- Active flag is shown but should be removed
- Boolean fields (approved/enabled) appear to update but don't persist
- Contact information fields don't save
- No UI for organizerTypes configuration
- Success message shows but data doesn't actually update

## Expected Behavior
- No active flag in edit form (programmatic only)
- All boolean fields should update correctly
- Contact information should save properly
- organizerTypes should be configurable via button cards
- isEventOrganizer should be locked to true

## Technical Notes
- Need to check the API payload being sent
- Verify backend is receiving and processing all fields
- Implement proper form state management for all fields

## Root Cause Analysis (SCOUT - 2025-01-06)
After investigating the code:

1. **API Integration**: The frontend is correctly calling the backend directly via `organizersApi.updateOrganizer` 
2. **Backend Model Mismatch**: 
   - Backend expects `fullName` but frontend sends `name`
   - Backend model doesn't have `isApproved` or `isAuthorized` fields
   - Only `isActive`, `isEnabled`, and `isRendered` exist in the backend
3. **Form Implementation Status**:
   - ✅ Active flag already removed from form
   - ✅ organizerTypes already implemented as button cards
   - ✅ isEventOrganizer already locked to true
   - ❌ Field mapping issues causing data not to persist

## Fixes Required
1. Remove `isApproved` and `isAuthorized` from the form (these fields don't exist in backend)
2. Ensure proper field mapping in API payload
3. Test that all valid fields are persisting correctly

## Acceptance Criteria
- [x] Active flag removed from edit form
- [ ] Remove isApproved and isAuthorized fields (don't exist in backend)
- [ ] Enabled flag updates correctly
- [ ] Contact information (email, phone, etc.) saves properly
- [x] organizerTypes displayed as button cards
- [x] isEventOrganizer locked to true (disabled)
- [ ] All changes persist after save