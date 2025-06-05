# FEATURE_3012_FirebaseUserManagementTab

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## Overview
Add a "Firebase" tab to User Management that displays all Firebase users with their complete information, shows match/unmatch status with userlogins (MongoDB), and provides linking capabilities via Firebase ID.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-06 15:15

- [x] Create Feature_3012_FirebaseUserManagementTab.md document
- [ ] Design Firebase tab UI layout and functionality
- [ ] Create API endpoint /api/firebase-users to fetch Firebase users
- [ ] Build Firebase tab component with match/unmatch display
- [ ] Add linking functionality between Firebase users and userlogins
- [ ] Test Firebase user management functionality

## 🧭 SCOUT (Required)
_Research, discoveries, risks, and open questions.  
Document findings and recommendations here._  
**Last updated:** 2025-01-06 15:15

- **Current Issue:** User Management delete only affects MongoDB, not Firebase
- **Research Needed:** Firebase Admin SDK capabilities for user listing
- **Questions:** 
  - How to efficiently match Firebase users with userlogins?
  - Should we provide Firebase user deletion capabilities?
  - What Firebase user properties should be displayed?

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-06 15:15

- **Pending:** Architecture design for Firebase integration

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-06 15:15

- **Pending:** Implementation start

---

## Summary
Create a new "Firebase" tab in User Management that provides comprehensive Firebase user administration capabilities, including viewing all Firebase users, identifying which ones have corresponding userlogins records, and enabling proper user lifecycle management.

## Motivation
Current User Management only shows MongoDB userlogins data. When users are "deleted" via the interface, they're only removed from MongoDB but remain in Firebase. This creates:
- Orphaned Firebase users
- Inability to see complete user picture
- No way to identify unmatched Firebase users
- Confusion about actual user deletion vs. userlogins deletion

## Scope
**In-Scope:**
- New "Firebase" tab in User Management page
- Display all Firebase users with complete information
- Show match/unmatch status with userlogins
- Link Firebase users to userlogins via Firebase ID
- Visual indicators for matched/unmatched users

**Out-of-Scope:**
- Firebase user deletion (security consideration)
- Firebase user creation via admin interface
- Bulk operations on Firebase users

## Feature Behavior
| Area       | Behavior Description                                  |
|------------|--------------------------------------------------------|
| UI         | New "Firebase" tab in User Management with DataGrid showing Firebase users |
| API        | New /api/firebase-users endpoint using Firebase Admin SDK |
| Backend    | Firebase Admin SDK integration for user listing |
| Integration | Match Firebase users with userlogins by firebaseUserId |

## Design
Firebase Tab Layout:
- DataGrid with columns: UID, Email, Display Name, Creation Date, Last Sign In, Matched Status, Actions
- Filter buttons: All Users, Matched, Unmatched
- Action buttons: View Details, Link to UserLogin
- Status indicators: ✓ Matched, ⚠ Unmatched, 🔗 Link Available

## Tasks
| Status         | Task                                | Last Updated  |
|----------------|-------------------------------------|---------------|
| ⏳ Pending      | Create /api/firebase-users endpoint |               |
| ⏳ Pending      | Build Firebase tab UI component     |               |
| ⏳ Pending      | Implement user matching logic       |               |
| ⏳ Pending      | Add Firebase tab to User Management |               |
| ⏳ Pending      | Test Firebase user display          |               |

## Rollback Plan
- Remove Firebase tab from User Management
- Remove /api/firebase-users endpoint
- Revert any Firebase Admin SDK changes

## Dependencies
- Firebase Admin SDK (already available)
- User Management page structure
- Existing userlogins API

## Linked Issues / Docs
- Related to user deletion concerns in User Management
- Addresses Firebase/MongoDB sync issues

## Owner
AI Guild (Claude)

## Timeline
| Milestone | Date       |
|-----------|------------|
| Created   | 2025-01-06 |
| First Dev | TBD        |
| Review    | TBD        |
| Completed | TBD        |

---

## Git Integration
Branch: `feature/3012-firebase-user-management-tab`
Target merge: DEVL branch after completion and testing