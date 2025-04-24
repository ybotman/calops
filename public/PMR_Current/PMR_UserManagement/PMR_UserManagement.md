# PMR_UserManagement

## Summary
Update and optimize the user management interface in CalOps, focusing on consistent data display, enhanced user role management, and improved application context integration.

## Scope
### Inclusions:
- All Users tab improvements including roles display and status fields
- Removal of temporary users tab and associated logic
- Application context implementation across all user screens
- Bug fix for data loading inconsistency between tabs
- Restoration of UI elements and icons from previous commit
- API pagination consistency checks

### Exclusions:
- No changes to user authentication processes
- No changes to the underlying role permission system
- No backend changes to the API endpoints

## Motivation
This PMR addresses usability issues in the user management interface. The current implementation has inconsistent role displays, redundant UI options, and potential data loading bugs. These fixes will improve admin workflow and ensure data consistency.

## Changes
- **Frontend:** Update role display, restore UI elements, fix pagination bugs, remove temp users tab
- **Backend:** No changes required
- **Infrastructure:** Ensure consistent application context usage with environment variables

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Data loading inconsistency between tabs | Implement proper caching and consistent data fetching |
| Missing role information in display | Ensure roleNameCode is concatenated properly from roleIds |
| Loss of user data during tab switching | Fix pagination and data refresh approach |

## Rollback Strategy
If rollback is required:
1. Revert to the previous commit on the feature branch
2. Return to the previous version of the users page component
3. Restore any removed code for temporary users if needed

## Dependencies
- MongoDB with UserLogin and Role collections
- Backend API functioning properly on port 3010 for development
- Environment variables for API endpoints properly configured

## Linked PMRs
None

## Owner
CalOps development team

## Timeline
- Start: 2025-04-23
- Deploy: 2025-04-24
- Final Review: 2025-04-25

## Post-Migration Tasks
- Performance monitoring for user data loading
- User feedback collection on the updated interface
- Documentation update for the admin guide

# Phase 1: User Interface Updates

### Goals
Fix the role and status display, remove the "Create Org" column, and implement proper status fields.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  🚧 In Progress | Update role display to show concatenated roleNameCode | 2025-04-23 |
|  🚧 In Progress | Remove "Create Org" column option | 2025-04-23 |
|  🚧 In Progress | Update status fields to show isApproved and isEnabled from localUserInfo | 2025-04-23 |
|  ⏳ Pending | Restore UI elements from lost commit | - |

### Rollback (if needed)
Revert code changes to the DataGrid columns definition in the user management component.

### Notes
Role display should concatenate the 2-character roleNameCode for better space efficiency in the table display.

# Phase 2: Tab Navigation and Data Loading Fix

### Goals
Fix the data inconsistency when navigating between tabs, particularly between All Users and Organizers.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  🚧 In Progress | Fix data refresh issue when switching between tabs | 2025-04-23 |
|  🚧 In Progress | Review API pagination implementation | 2025-04-23 |
|  ⏳ Pending | Implement proper caching strategy for user data | - |
|  ⏳ Pending | Add error handling for failed data fetches | - |

### Rollback (if needed)
Revert changes to tab change handlers and user data fetching functions.

### Notes
The issue appears to be related to inconsistent state management when switching between tabs.

# Phase 3: Temporary Users Removal

### Goals
Remove the temporary users tab and associated logic that is no longer needed.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  🚧 In Progress | Remove Temp Users tab from UI | 2025-04-23 |
|  🚧 In Progress | Remove associated logic for temporary users | 2025-04-23 |
|  ⏳ Pending | Clean up related functions like handleDeleteAllTempUsers | - |
|  ⏳ Pending | Update tab navigation to handle removed tab | - |

### Rollback (if needed)
Restore the temporary users tab component and its associated logic from backup.

### Notes
Temporary users were previously needed during migration but are no longer required for the system.

# Phase 4: Application Context Integration

### Goals
Ensure consistent application context usage across the user management screens.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  🚧 In Progress | Implement useAppContext hook in user management pages | 2025-04-23 |
|  🚧 In Progress | Pass appId to all API calls consistently | 2025-04-23 |
|  ⏳ Pending | Maintain application selection persistence | - |
|  ⏳ Pending | Update UI to show current application context | - |

### Rollback (if needed)
Revert to direct appId usage instead of context-based approach.

### Notes
Application context should drive all API calls with the proper appId for TangoTiempo (1) and HarmonyJunction (2).

# Phase 5: Asset and UI Restoration

### Goals
Restore browser icons, main page images, and user edit screen format from the lost commit.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  🚧 In Progress | Restore browser icons from previous commit | 2025-04-23 |
|  🚧 In Progress | Restore main page image | 2025-04-23 |
|  ⏳ Pending | Restore user edit screen format and fields | - |
|  ⏳ Pending | Ensure consistent design across all user screens | - |

### Rollback (if needed)
Revert to current images and UI elements if the restored ones cause issues.

### Notes
All code that used mock data or fallbacks should be removed as we're working with a production system with real data.