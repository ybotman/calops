# FEATURE_3004_DashboardRevamp

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-30 12:00

- [ ] Scout: Verify if MongoDB status component is still needed
- [ ] Fix events count showing 0 instead of actual count
- [ ] Add BACKEND and FIREBASE variable values with masking (last 10 char ****10char)
- [ ] Add dropdown for active environment variables only

## 🧭 SCOUT (Required)
_Research, discoveries, risks, and open questions.  
Document findings and recommendations here._  
**Last updated:** 2025-01-30 12:45

**Current Implementation Findings:**
- ✅ **StatusPanel Location**: `/src/app/dashboard/components/StatusPanel.js`
- ✅ **Dashboard Page**: `/src/app/dashboard/page.js` 
- ✅ **Status API**: `/src/app/api/status/route.js`

**Status Panel Analysis:**
- Currently shows 3 services: MongoDB Database, Firebase Authentication, Backend API
- MongoDB status IS still being checked via `connectToDatabase()` call
- Environment variables are NOT currently displayed
- Status API returns: database.status, firebase.status, backend.status + backend.url

**Events Count Issue:** ✅ IDENTIFIED
- Events API uses `/api/events?appId=${appId}&countOnly=true` 
- ❌ Backend `/be-info/routes/serverEvents.js` does NOT support `countOnly` parameter
- Backend returns full pagination object: `{events: [], pagination: {total: count, ...}}`
- Frontend expects just `{count: number}` when `countOnly=true`
- ✅ **Root Cause**: Frontend requests `countOnly=true` but backend ignores parameter and returns full response

**Environment Variables Found:**
- `NEXT_PUBLIC_BE_URL` (Backend URL) - currently displayed as backend.url
- `npm_package_version` - used in status
- Firebase env vars (not directly shown)
- MongoDB connection string (not shown)

**MongoDB Assessment:**
- ✅ MongoDB connection check IS still needed - used for database connectivity status
- StatusPanel line 94-97 checks if database.status === 'error' for overall system health
- Recommendation: Keep MongoDB status check

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-30 12:00

- User approved dashboard revamp with specific requirements listed below

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-30 12:00

- Implementation pending architecture and scouting phase

---

## Summary
Revamp the dashboard status panel to show more relevant information, remove unnecessary components, fix display issues, and add environment variable visibility.

## Motivation
Current dashboard status panel needs improvements:
- Environment variable values are not visible for debugging
- Events count is incorrectly showing 0  
- MongoDB status may no longer be needed
- Need better visibility into active environment variables

## Scope
**In-Scope:**
- Status panel component enhancements
- Environment variable display with masking
- Events count fix
- MongoDB status evaluation and potential removal
- Environment variables dropdown (active only)

**Out-of-Scope:** 
- Full dashboard redesign beyond status panel
- Adding new dashboard sections not specified

## Feature Behavior
| Area       | Behavior Description                                  |
|------------|--------------------------------------------------------|
| UI         | Enhanced status panel with variable values and dropdown |
| Backend    | Verify MongoDB connection necessity                    |
| Display    | Fix events count, add masked env vars display         |
| UX         | Dropdown for active environment variables only        |

## Tasks
| Status         | Task                                | Last Updated  |
|----------------|-------------------------------------|---------------|
| ✅ Completed    | Scout MongoDB necessity             | 2025-01-30    |
| ⏳ Pending      | Fix events count showing 0          | 2025-01-30    |
| ⏳ Pending      | Add BACKEND/FIREBASE masked values  | 2025-01-30    |
| ⏳ Pending      | Create env variables dropdown       | 2025-01-30    |
| ⏳ Pending      | Test all dashboard changes          | 2025-01-30    |

## Requirements Detail
1. **Status Details Enhancement:** Add variable values for BACKEND and FIREBASE (show last 10 characters with masking: ****10char)
2. **MongoDB Evaluation:** Scout to verify if MongoDB status is still needed - backend URL may handle this now
3. **Events Count Fix:** Resolve issue where events is showing 0 instead of actual count
4. **Environment Variables Dropdown:** Add dropdown showing only active environment variables (exclude legacy vars)

## Dependencies
- Current dashboard/status panel component
- Environment variable configuration
- Backend API status endpoints
- Events count API

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
- Branch: `feature/3004-dashboard-revamp`
- All commits should reference this FEATURE_3004_DashboardRevamp.md document