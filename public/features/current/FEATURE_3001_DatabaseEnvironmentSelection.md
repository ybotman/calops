# FEATURE_3001_DatabaseEnvironmentSelection

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-28 16:30

- [x] Create Feature_3001 document
- [ ] Research current MongoDB connection implementation
- [ ] Design environment selection mechanism (TEST as default)
- [ ] Implement database environment switching functionality  
- [ ] Test database switching between TEST and PROD environments

## 🧭 SCOUT (Required)
_Research, discoveries, risks, and open questions.  
Document findings and recommendations here._  
**Last updated:** 2025-01-28 18:00

**CRITICAL ISSUE DISCOVERED:**
Most API routes are **NOT using the database environment context**. Two patterns found:

**Pattern 1: Direct Database (Working with Environment)**
- Routes like `/api/debug/route.js` use `connectToDatabase()` directly
- These routes DO respect the environment selection
- Used by: debug, status, some venue operations

**Pattern 2: Backend Proxy (NOT Working with Environment)** 
- Routes like `/api/users/route.js`, `/api/roles/route.js` proxy to `localhost:3010` backend
- These routes IGNORE environment context completely
- Used by: users, roles, organizers, events, applications

**Specific Issues Found:**
- `src/app/api/users/route.js` Line 230: `axios.get(${BE_URL}/api/userlogins/all)` 
- `src/app/api/roles/route.js` Line 14: `axios.get(${BE_URL}/api/roles)`
- **21 API routes** use `BE_URL` proxy pattern, ignoring environment

**Impact:**
- Users, Organizers, Venues pages always connect to same backend database
- Environment switching only affects direct database routes
- No environment context passed to backend service

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-28 18:00

**Original Architecture Design:**
1. **Environment Selection Mechanism:** ✅ COMPLETED
2. **Connection URI Selection:** ✅ COMPLETED  
3. **Cache Management:** ✅ COMPLETED
4. **Function Signature:** ✅ COMPLETED

**CRITICAL FIX REQUIRED:**
**Problem:** 21 API routes use backend proxy pattern, ignoring environment context

**BEST PRACTICE RECOMMENDATION: Direct Database Pattern**

**Architecture Decision: Pattern 1 (Direct Database) - APPROVED**

**Why Direct Database is Best Practice:**
1. **Single Source of Truth:** Application directly manages its own database connections
2. **Environment Control:** Full control over which database environment is used
3. **Performance:** Eliminates network hop to backend service
4. **Simplicity:** Fewer moving parts, easier to debug
5. **Security:** No exposed backend API endpoints
6. **Consistency:** All routes use same connection pattern

**Implementation Strategy:**

**Phase 1: Convert Critical User-Facing Routes (IMMEDIATE)**
- `/api/users` → Direct MongoDB with UserLogin model
- `/api/roles` → Direct MongoDB with Role model  
- `/api/organizers` → Direct MongoDB with Organizer model

**Phase 2: Convert Remaining Routes (GRADUAL)**
- `/api/events` → Direct MongoDB with Event model
- `/api/venues` → Direct MongoDB with Venue model
- `/api/applications` → Direct MongoDB with Application model

**Phase 3: Retire Backend Proxy Pattern**
- Remove `BE_URL` dependencies
- Consolidate all database operations in CalOps application

**Benefits:**
- ✅ **Immediate environment context support**
- ✅ **Reduced complexity** (no backend service dependency)
- ✅ **Better performance** (direct database access)
- ✅ **Easier debugging** (single application layer)
- ✅ **Future-proof architecture** (self-contained)

**Migration Path:**
1. Create MongoDB models in `/src/lib/models.js` 
2. Convert one route at a time using `getApiDatabase(request)`
3. Test environment switching works per route
4. Remove backend proxy code once all routes converted

**Architectural Principle:** Follows microservice best practices where each application manages its own data layer directly.

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-28 17:00

**Implementation Completed:**
1. **Created feature branch:** `feature/3001-database-environment-selection`

2. **Enhanced `/src/lib/mongodb.js`:**
   - Added `getMongoURI(environment)` function for URI selection
   - Modified cache structure: `{ test: {conn, promise}, prod: {conn, promise} }`
   - Updated `connectToDatabase(environment = 'test')` with environment parameter
   - Added environment validation ('test' or 'prod' only)
   - Enhanced error messages with environment context
   - Improved logging to show which database environment is connected

3. **Added Dashboard UI Components:**
   - Created `DatabaseContext` for environment state management
   - Built `DatabaseEnvironmentSwitcher` component with safe confirmation dialog
   - Added warning alerts for production database access
   - Integrated switcher into AdminLayout toolbar

4. **Enhanced API Client:**
   - Updated `api-client.js` to include database environment headers
   - Created `DatabaseEnvironmentSync` component for context synchronization
   - Added interceptors to automatically include environment in local API calls

5. **Complete Integration:**
   - Added DatabaseProvider to root layout
   - Environment switcher visible in dashboard toolbar
   - All API routes receive environment information via headers
   - Safe defaults (TEST environment) maintained throughout

**Usage Examples:**
```javascript
// Backend usage - connects to TEST (default)
await connectToDatabase();

// Explicit environment selection
await connectToDatabase('test');
await connectToDatabase('prod');

// Frontend usage - controlled via UI switcher
// API calls automatically include current environment header
```

---

## Summary
Add the ability to run the application on either TEST database (default) or PROD database by leveraging existing environment variables `MONGODB_URI` (TEST) and `MONGODB_URI_PROD`.

## Motivation
- Enable developers to safely test against production data when needed
- Provide production database access for administrative tasks
- Maintain TEST as default for safe development workflow
- Utilize existing environment variable infrastructure

## Scope
- **In-Scope:** Database environment selection mechanism, connection management, cache handling
- **Out-of-Scope:** Database migration, data synchronization, backup functionality

## Feature Behavior
| Area       | Behavior Description                                  |
|------------|--------------------------------------------------------|
| UI         | No UI changes required - environment selection via code/config |
| API        | All API routes can connect to either TEST or PROD database |
| Backend    | Enhanced MongoDB connection with environment selection |
| Integration | Uses existing MONGODB_URI and MONGODB_URI_PROD variables |

## Design
Environment selection will be handled at the connection level with TEST as the default behavior to maintain safe development practices.

## Tasks
| Status         | Task                                | Last Updated  |
|----------------|-------------------------------------|---------------|
| ✅ Complete    | Create Feature_3001 document        | 2025-01-28    |
| ✅ Complete    | Research current MongoDB implementation | 2025-01-28  |
| ✅ Complete    | Design environment selection mechanism | 2025-01-28 |
| ✅ Complete    | Implement database environment switching | 2025-01-28 |
| ❌ Failed      | Test functionality with both environments | 2025-01-28 |
| 🚧 Critical   | Document best practice recommendation | 2025-01-28 |
| ✅ Complete   | Architect direct database pattern strategy | 2025-01-28 |
| ⏳ Pending    | Phase 1: Convert /api/users to direct database | 2025-01-28 |
| ⏳ Pending    | Phase 1: Convert /api/roles to direct database | 2025-01-28 |
| ⏳ Pending    | Phase 1: Convert /api/organizers to direct database | 2025-01-28 |
| ⏳ Pending    | Phase 2: Convert remaining routes (events, venues, apps) | 2025-01-28 |
| ⏳ Pending    | Phase 3: Retire backend proxy pattern completely | 2025-01-28 |

## Rollback Plan
- Revert changes to `/src/lib/mongodb.js`
- Ensure all connections default back to TEST database
- Verify no production data contamination in TEST environment

## Dependencies
- Existing `MONGODB_URI` and `MONGODB_URI_PROD` environment variables
- Current MongoDB connection architecture in `/src/lib/mongodb.js`
- Scripts in `/scripts/` folder that use MongoDB connections

## Linked Issues / Docs
- Related to backend environment management
- Supports administrative and development workflows

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
- Branch: `feature/3001-database-environment-selection`
- Started from: `DEVL`
- Target merge: `DEVL` after completion and testing