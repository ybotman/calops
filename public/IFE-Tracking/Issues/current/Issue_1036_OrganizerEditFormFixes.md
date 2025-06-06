# Issue 1036: Organizer Edit Form Fixes

## Issue Details
- **Issue ID**: 1036
- **Type**: Bug/Enhancement
- **Priority**: High
- **Status**: 🔴 Open
- **Created**: 2025-01-06
- **Reporter**: tobybalsley

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

## Acceptance Criteria
- [ ] Active flag removed from edit form
- [ ] Approved and Enabled flags update correctly
- [ ] Contact information (email, phone, etc.) saves properly
- [ ] organizerTypes displayed as button cards
- [ ] isEventOrganizer locked to true (disabled)
- [ ] All changes persist after save