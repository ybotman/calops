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
**Last updated:** 2025-01-30 13:00

- ✅ User approved dashboard revamp with specific requirements
- ✅ User approved scout findings and next steps to architecture phase

**Technical Architecture Decisions:**

**1. Events Count Fix:**
- **Problem**: Backend `/api/events` doesn't support `countOnly=true` parameter
- **Solution**: Modify frontend `eventsApi.getEventCounts()` to parse existing pagination response
- **Rationale**: Faster implementation than backend changes; backend already returns `pagination.total`
- **Implementation**: Update api-client.js to extract count from `response.data.pagination.total`

**2. Environment Variables Display:**
- **Location**: Enhance StatusPanel.js to show masked environment variables
- **Display Format**: `NEXT_PUBLIC_BE_URL: ****localhost:3010` (last 10 chars visible)
- **Variables to Show**: BACKEND (NEXT_PUBLIC_BE_URL), FIREBASE (project config), npm_package_version
- **Implementation**: Add new section to StatusPanel with environment variable display

**3. Environment Variables Dropdown:**
- **Location**: Add dropdown component to StatusPanel
- **Content**: Only show actively used environment variables (exclude legacy)
- **Active Variables**: NEXT_PUBLIC_BE_URL, npm_package_version, Firebase config vars
- **Implementation**: Create expandable dropdown showing full env var list with descriptions

**4. MongoDB Status Assessment:**
- **Decision**: KEEP MongoDB status check
- **Rationale**: Required for overall system health monitoring and database connectivity verification
- **No Changes**: MongoDB display remains as-is

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-30 13:05

- ✅ User approved architecture and builder confidence assessment (85% HIGH)
- ✅ **IMPLEMENTATION COMPLETED SUCCESSFULLY**

**Implementation Details:**

**1. Events Count Fix (✅ COMPLETED)**
- **File**: `/src/lib/api-client.js:955-958`
- **Change**: Updated `response.data?.count` to `response.data?.pagination?.total`
- **Result**: Events count now properly extracts from backend pagination response
- **Impact**: Dashboard will show actual event counts instead of 0

**2. Environment Variables Display (✅ COMPLETED)**
- **File**: `/src/app/dashboard/components/StatusPanel.js`
- **Added**: New "Environment Configuration" section with masked values
- **Features**: 
  - Backend URL with masking (shows last 10 chars: `****localhost:3010`)
  - App Version display
  - Firebase configuration status
- **Function**: `maskEnvValue()` handles value masking logic

**3. Environment Variables Dropdown (✅ COMPLETED)**
- **File**: `/src/app/dashboard/components/StatusPanel.js`
- **Added**: Expandable dropdown showing active environment variables
- **Features**:
  - Toggle button to show/hide full env var list
  - Active variables only: NEXT_PUBLIC_BE_URL, NODE_ENV, VERCEL_ENV
  - Each var shows masked value + description
- **Functions**: `toggleEnvExpanded()`, `getActiveEnvVars()`

**4. Testing (✅ COMPLETED)**
- ✅ Development server started successfully on port 3023
- ✅ No build errors or compilation issues
- ✅ All components render without errors
- ✅ **USER TESTED - APPROVED: "tested good"**

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
| ✅ Completed    | Architect technical solutions       | 2025-01-30    |
| ✅ Completed    | Fix events count API parsing        | 2025-01-30    |
| ✅ Completed    | Add BACKEND/FIREBASE masked values  | 2025-01-30    |
| ✅ Completed    | Create env variables dropdown       | 2025-01-30    |
| ✅ Completed    | Test all dashboard changes          | 2025-01-30    |

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