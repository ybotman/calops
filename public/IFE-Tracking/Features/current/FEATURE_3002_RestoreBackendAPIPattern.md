# FEATURE_3002_RestoreBackendAPIPattern

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-28 23:05

- [ ] Revert `/api/users/route.js` from direct MongoDB to backend proxy pattern
- [ ] Revert `/api/roles/route.js` from direct MongoDB to backend proxy pattern  
- [ ] Revert `/api/organizers/route.js` from direct MongoDB to backend proxy pattern
- [ ] Remove database environment switching UI components entirely
- [ ] Remove DatabaseContext and DatabaseEnvironmentSync components
- [ ] Remove DatabaseEnvironmentSwitcher from AdminLayout
- [ ] Clean up direct MongoDB connection infrastructure
- [ ] Remove getApiDatabase utility functions
- [ ] Test all reverted routes work with backend service
- [ ] Verify no MongoDB timeouts or connection issues

## 🧭 SCOUT (Required)
_Research, discoveries, risks, and open questions.  
Document findings and recommendations here._  
**Last updated:** 2025-01-28 23:05

**Rollback Required From Feature 3001:**

**Files to Revert:**
- `src/app/api/users/route.js` - Remove direct MongoDB, restore axios proxy
- `src/app/api/roles/route.js` - Remove direct MongoDB, restore axios proxy  
- `src/app/api/organizers/route.js` - Remove direct MongoDB, restore axios proxy

**UI Components to Remove:**
- `src/components/DatabaseEnvironmentSwitcher.js`
- `src/components/DatabaseEnvironmentSync.js` 
- `src/lib/DatabaseContext.js`
- Database switcher integration in AdminLayout

**Infrastructure to Clean:**
- `src/lib/api-database.js` - Remove getApiDatabase functions
- Database environment header handling in api-client
- Environment selection state management

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-28 23:05

**Architecture Decision: Restore Backend Proxy Pattern - APPROVED**

**Rationale for Rollback:**
1. **Database Connection Constraint**: Backend service controls its own database connections via environment variables
2. **MongoDB Timeout Issues**: Direct database connections experiencing 10-second timeouts  
3. **Operational Complexity**: Direct database pattern adds unnecessary complexity
4. **Reliability**: Backend proxy pattern is proven and stable

**Restore Strategy:**
1. **Revert API Routes**: Restore original axios proxy implementations with BE_URL
2. **Preserve Performance**: Keep any performance optimizations that don't require direct database access
3. **Clean Removal**: Remove all database switching infrastructure completely
4. **Test Validation**: Ensure backend service connectivity and performance

**Target Architecture:**
- All API routes use `axios.get(${BE_URL}/api/...)` pattern
- Single database environment controlled by backend service configuration
- No frontend database switching capability
- Simplified, reliable architecture

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-28 23:05

**Implementation pending...**

---

## Summary
Rollback Feature 3001 database environment switching functionality and restore all API routes to use backend proxy pattern for reliability and operational simplicity.

## Motivation
- Resolve MongoDB connection timeout issues
- Restore operational reliability and consistency
- Simplify architecture by removing direct database complexity
- Ensure all routes work consistently through backend service

## Scope
- **In-Scope:** Rollback direct MongoDB routes, remove switching UI, restore backend proxy
- **Out-of-Scope:** Backend service configuration changes, new functionality additions

## Feature Behavior
| Area       | Behavior Description                                  |
|------------|--------------------------------------------------------|
| UI         | Remove database environment switcher from dashboard   |
| API        | All routes restored to backend proxy pattern          |
| Backend    | Single database environment controlled by backend     |
| Integration | Simplified axios-based API calls                     |

## Tasks
| Status         | Task                                | Last Updated  |
|----------------|-------------------------------------|---------------|
| ⏳ Pending      | Revert /api/users route to backend proxy            | 2025-01-28    |
| ⏳ Pending      | Revert /api/roles route to backend proxy            | 2025-01-28    |
| ⏳ Pending      | Revert /api/organizers route to backend proxy       | 2025-01-28    |
| ⏳ Pending      | Remove database switching UI components              | 2025-01-28    |
| ⏳ Pending      | Clean up MongoDB connection infrastructure           | 2025-01-28    |
| ⏳ Pending      | Test backend connectivity and performance            | 2025-01-28    |

## Rollback Plan
This feature IS the rollback plan for Feature 3001.

## Dependencies
- Backend service running on localhost:3010
- Existing axios-based API patterns
- Original route implementations (if available in git history)

## Linked Issues / Docs
- Related to Feature 3001 (cancelled)
- Addresses MongoDB timeout issues
- Restores operational stability

## Owner
AI Guild - Feature Development Team

## Timeline
| Milestone | Date       |
|-----------|------------|
| Created   | 2025-01-28 |
| First Dev | 2025-01-28 |
| Review    | TBD        |
| Completed | TBD        |

---

## Git Integration
- Branch: `feature/3002-restore-backend-api-pattern`
- Started from: `feature/3001-database-environment-selection`
- Target merge: `DEVL` after completion and testing