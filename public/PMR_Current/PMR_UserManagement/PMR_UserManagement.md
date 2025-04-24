# PMR_UserManagement

## Summary
Update and optimize the user management interface in CalOps, focusing on consistent data display, enhanced user role management, and improved application context integration. This PMR completely removes temporary user functionality that is no longer needed, improves role display, and integrates proper Firebase user synchronization.

## Scope
### Inclusions:
- All Users tab improvements including roles display and status fields
- Complete removal of temporary users tab and associated code (attributes, visual indicators, etc.)
- Fix for the bug causing data inconsistency when navigating between tabs
- Integration of proper Firebase user import functionality
- API pagination consistency checks
- Removal of all fallback/mock data since real API data is required

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

## Implementation Summary

After analyzing the existing code and the previous commit (dc22569959e70165daad3744b8151f1bb106d03f), we have identified several key aspects to address in this PMR:

[View the detailed Role Display issue analysis and resolution](./PMR_RoleDisplay_Issue.md)

1. **Role Display Enhancement** - The current UI shows full role names, but we should use the more compact roleNameCode (2-character codes) concatenated together as specified. The Role model already has this field available.

2. **Status Fields Improvement** - The status display needs to show the nested isApproved and isEnabled fields from localUserInfo rather than the top-level active status. This provides admins with more granular control.

3. **Create Organizer Option Removal** - The Create Org option in the actions column should be removed as requested to streamline the interface.

4. **Tab Navigation Bug Fix** - There's an inconsistency when switching between All Users and Organizers tabs where the data doesn't refresh properly. This is likely due to how the filterUsers function applies filters.

5. **Temporary User Functionality Removal** - All temp user functionality, including the dedicated tab, filtering, and related functions should be completely removed. This includes UI components and underlying data handling.

6. **Firebase Integration** - The system should use the Firebase import functionality that exists in the maintenance section. This provides a more robust way to manage users than the temporary user approach.

7. **Mock Data Removal** - All fallback mock data should be removed, with proper error handling used instead to ensure the application works with real API data only. If an attribute is empty, it should be shown as empty. If an attribute lookup fails, '?' should be used as the indicator.

8. **Application Context Integration** - The application context should be consistently applied across all API calls to ensure proper appId usage.

This comprehensive approach will result in a more maintainable, efficient user management interface that aligns with current system requirements.

# Phase 0: Current vs. Desired State Analysis

### Goals
Analyze key differences between current implementation and the previous commit (dc22569959e70165daad3744b8151f1bb106d03f) to understand what needs to be incorporated.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  ✅ Complete | Analyze previous commit (dc22569959e70165daad3744b8151f1bb106d03f) | 2025-04-23 |
|  ✅ Complete | Identify Firebase sync functionality to be incorporated | 2025-04-23 |
|  ✅ Complete | Assess temp user features to be removed | 2025-04-23 |
|  ✅ Complete | Document key implementation requirements | 2025-04-23 |

### Rollback (if needed)
No rollback needed for analysis phase.

### Notes
Key differences identified:
1. Previous commit improved geo hierarchy and venue API proxying, shifting away from direct MongoDB dependencies
2. Firebase import functionality exists in maintenance section but isn't leveraged in main user UI
3. Temporary user features are spread across multiple components and need complete removal
4. Role display needs to use roleNameCode from roles collection for more efficient display

# Phase 1: User Interface Updates

### Goals
Fix the role and status display, remove the "Create Org" column, and implement proper status fields.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  ✅ Complete | Update role display to show concatenated roleNameCode | 2025-04-24 |
|  ✅ Complete | Remove "Create Org" column option | 2025-04-24 |
|  ✅ Complete | Update status fields to show isApproved and isEnabled from localUserInfo | 2025-04-24 |
|  ⏳ Pending | Restore UI elements from lost commit | - |

### Rollback (if needed)
Revert code changes to the DataGrid columns definition in the user management component.

### Notes
- Role display now correctly shows comma-separated roleNameCode values from backend API
- Fixed string comparison for role IDs (converting both to strings before comparison)
- Roles are properly looked up from in-memory roles list when needed
- Fixed React closure issue with roles data not being available during user processing
- If roleNameCode can't be found, '?' is displayed as indicator
- No fallback mock data is used - proper error handling implemented throughout
- "Create Org" button has been completely removed from action column
- Status column split into two separate columns: "Approved" and "Enabled" using localUserInfo fields
- Fixed a potential error in search filter by adding optional chaining to firebaseUserId lookup

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
Completely remove the temporary users tab and all associated logic, attributes, and visual indicators.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  🚧 In Progress | Remove Temp Users tab from UI | 2025-04-23 |
|  🚧 In Progress | Remove all temp user indicators and UI elements | 2025-04-23 |
|  🚧 In Progress | Remove handleDeleteAllTempUsers and related functions | 2025-04-23 |
|  ⏳ Pending | Update tab navigation to handle removed tab | - |
|  ⏳ Pending | Remove all code that checks for or filters temporary users | - |
|  ⏳ Pending | Remove temporary user attributes from data processing | - |

### Rollback (if needed)
Restore the temporary users tab component and its associated logic from backup.

### Notes
Temporary users were previously needed during migration but are no longer required. All references to them should be removed including UI elements, attribute checks, and filter logic. The system should use the Firebase import functionality for proper user management instead.

# Phase 4: Data Consistency and Error Handling

### Goals
Ensure consistent API data usage with proper error handling.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  ✅ Complete | Remove all fallback mock data | 2025-04-24 |
|  ✅ Complete | Implement proper error handling for API failures | 2025-04-24 |
|  🚧 In Progress | Ensure consistent data flow through the application | 2025-04-24 |
|  ⏳ Pending | Add loading states for better user experience | - |

### Rollback (if needed)
Revert error handling changes if more robust fallbacks are later deemed necessary.

### Notes
- All mock data has been removed from the codebase
- Application now relies solely on the real backend API
- Clear error messages are shown when API calls fail
- If attribute lookups fail, '?' is displayed instead of fabricating data
- Empty attributes are shown as empty, preserving data integrity

# Phase 5: Firebase Integration and Application Context

### Goals
Integrate proper Firebase user management functionality and ensure consistent application context usage.

### Tasks
| Status | Task | Last Updated |
|------|--------|--------------|
|  🚧 In Progress | Restore user edit screen format and fields | 2025-04-23 |
|  🚧 In Progress | Implement AppContext consistently across all user screens | 2025-04-23 |
|  ⏳ Pending | Integrate Firebase import functionality from maintenance screen | - |
|  ⏳ Pending | Ensure application selection persists across sessions | - |
|  ⏳ Pending | Add proper error handling for API failures | - |

### Rollback (if needed)
Revert to current implementation if Firebase integration issues arise.

### Notes
The system should leverage the existing Firebase import functionality rather than temporary users. This provides a more robust and maintainable solution for user management. We will not be changing the favicon as part of this PMR.