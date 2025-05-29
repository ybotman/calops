# FEATURE_3005_UserRolesDisplay

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-30 12:10

- [ ] Scout: Investigate current Users Grid role display showing "UNK"
- [ ] Scout: Identify backend API endpoint for cached role values
- [ ] Architect: Design role display using smallest coded value
- [ ] Builder: Implement API call to fetch role values
- [ ] Builder: Update Users Grid to display proper role names

## 🧭 SCOUT (Required)
_Research, discoveries, risks, and open questions.  
Document findings and recommendations here._  
**Last updated:** 2025-01-30 14:00

**✅ ROOT CAUSE IDENTIFIED:**

**Users Grid Component:**
- **Location**: `/src/components/users/components/UserTable.js:38`
- **Display**: Uses `{ field: 'roleNames', headerName: 'Roles', width: 120 }`
- **Data Source**: `user.roleNames` populated by `useUsers` hook

**Role Processing Chain:**
1. **useUsers.js:63** calls `processRoleIds(user.roleIds)` 
2. **useRoles.js:114-148** `processRoleIds()` function processes role IDs
3. **Returns "UNK"** on lines 130, 136, 139 when role lookup fails

**Backend API Structure:**
- **Endpoint**: `/api/roles?appId=${appId}` (serverRoles.js)
- **Response**: `{roles: [], pagination: {...}}`
- **Role Model**: `{roleName, roleNameCode, description, appId, permissions}`
- **Cached**: ~10 roles with roleNameCode (smallest coded value)

**"Smallest Coded Value" Definition:**
- ✅ **roleNameCode** field (e.g., 'SYA', 'RGA', 'RGO', 'USR')
- Examples: SystemAdmin='SYA', RegionalAdmin='RGA', RegionalOrganizer='RGO'

**Issue Analysis:**
- ❌ **Timing Issue**: Roles array may be empty when processRoleIds runs
- ❌ **Cache Miss**: roleId not found in roles array returns 'UNK'
- ❌ **Async Loading**: useRoles loading state not properly synchronized

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-30 12:10

- User approved fixing role display in Users Grid using backend API cached values

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-30 12:10

- Implementation pending architecture and scouting phase

---

## Summary
Fix the Users Grid role display that currently shows "UNK" by using backend API to fetch cached role values and display the smallest coded value for each role.

## Motivation
Users Grid currently displays "UNK" for user roles instead of meaningful role names, making it difficult to understand user permissions and assignments at a glance.

## Scope
**In-Scope:**
- Users Grid role column enhancement
- Backend API integration for role data
- Role display using smallest coded value
- Cached role values retrieval (~10 roles)

**Out-of-Scope:** 
- Role management or editing functionality
- User assignment to roles
- Role permissions modification

## Feature Behavior
| Area       | Behavior Description                                  |
|------------|--------------------------------------------------------|
| UI         | Users Grid displays actual role names instead of "UNK" |
| API        | Fetch cached role values from backend endpoint        |
| Display    | Show smallest coded value for each role                |
| Data       | Use cached role data (~10 total roles)                |

## Tasks
| Status         | Task                                | Last Updated  |
|----------------|-------------------------------------|---------------|
| ✅ Completed    | Locate Users Grid component         | 2025-01-30    |
| ✅ Completed    | Find backend roles API endpoint     | 2025-01-30    |
| ✅ Completed    | Understand "smallest coded value"   | 2025-01-30    |
| ⏳ Pending      | Design solution for timing issues   | 2025-01-30    |
| ⏳ Pending      | Implement role loading fix          | 2025-01-30    |
| ⏳ Pending      | Test role display in Users Grid     | 2025-01-30    |

## Requirements Detail
- **Current Issue:** Users Grid shows "UNK" for roles
- **Solution:** Use backend API to get cached role values (approximately 10 roles)
- **Display:** Show the "smallest coded value" for each role
- **Data Source:** Backend cached role values

## Dependencies
- Users Grid component
- Backend API roles endpoint
- Cached role data structure
- Understanding of "smallest coded value" format

## Owner
AI Guild Development Team

## Timeline
| Milestone | Date       |
|-----------|------------|
| Created   | 2025-01-30 |
| Scout     | TBD        |
| Design    | TBD        |
| Build     | TBD        |
| Completed | TBD        |

---

## Git Integration
- Branch: `feature/3005-user-roles-display`
- All commits should reference this FEATURE_3005_UserRolesDisplay.md document