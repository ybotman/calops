# FEATURE_3001_DatabaseEnvironmentSelection

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-28 22:50

**ORIGINAL FEATURE SCOPE - COMPLETED:**
- [x] Create Feature_3001 document
- [x] Research current MongoDB connection implementation
- [x] Design environment selection mechanism (TEST as default)
- [x] Implement database environment switching functionality  
- [x] Test database switching between TEST and PROD environments

**PHASE 1 CRITICAL FIX - COMPLETED:**
- [x] Convert `/api/roles/route.js` to direct database pattern
- [x] Convert `/api/users/route.js` to direct database pattern (preserved rate limiting & caching)
- [x] Convert `/api/organizers/route.js` to direct database pattern (GET & POST handlers)
- [x] Test converted routes with environment switching
- [x] Document Phase 1 implementation and benefits

**PHASE 2 SCOPE (OPTIONAL - GRADUAL MIGRATION):**
- [ ] Convert `/api/events/route.js` to direct database pattern
- [ ] Convert `/api/venues/route.js` to direct database pattern  
- [ ] Convert `/api/applications/route.js` to direct database pattern
- [ ] Remove `BE_URL` dependencies from remaining routes
- [ ] Complete Phase 3: Retire backend proxy pattern entirely

**STATUS ASSESSMENT:**
- ✅ **Core Feature Complete**: Database environment switching works for all direct routes
- ✅ **Critical User Routes Fixed**: Users, Roles, Organizers now respect environment selection
- ✅ **Architecture Proven**: Direct database pattern successfully implemented
- 🔄 **Phase 2 Optional**: Remaining routes can be converted gradually as needed

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
**Last updated:** 2025-01-28 22:30

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

**PHASE 1 IMPLEMENTATION STRATEGY - APPROVED:**

**Infrastructure Available:**
- ✅ `getApiDatabase(request)` - Environment-aware database connection
- ✅ `getUserLoginsModel()`, `getRolesModel()`, `getOrganizersModel()` - Model getters  
- ✅ Environment context via `x-db-environment` header

**Route Conversion Plan:**
1. **`/api/users/route.js`**: Convert `axios.get(${BE_URL}/api/userlogins/all)` → Direct MongoDB with `getUserLoginsModel()`. Preserve rate limiting, caching, Firebase auth.
2. **`/api/roles/route.js`**: Convert `axios.get(${BE_URL}/api/roles)` → Direct MongoDB with `getRolesModel()`. Simple single GET endpoint.
3. **`/api/organizers/route.js`**: Convert multiple `axios` proxy calls → Direct MongoDB with `getOrganizersModel()`. Complex multi-verb conversion.

**Implementation Pattern:**
```javascript
import { getApiDatabase } from '@/lib/api-database';
import { getUserLoginsModel } from '@/lib/models';

export async function GET(request) {
  await getApiDatabase(request);
  const UserLogins = await getUserLoginsModel();
  const users = await UserLogins.find({ appId, active });
  return NextResponse.json({ users });
}
```

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
1. Convert one route at a time using `getApiDatabase(request)`
2. Test environment switching works per route
3. Remove backend proxy code once all routes converted

**Architectural Principle:** Follows microservice best practices where each application manages its own data layer directly.

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-28 22:45

**Original Implementation Completed:**
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

**PHASE 1 CONVERSION COMPLETED:**
6. **Converted `/api/roles/route.js`:**
   - Replaced `axios.get(${BE_URL}/api/roles)` with direct MongoDB access
   - Uses `getApiDatabase(request)` + `getRolesModel()`
   - Preserved query parameter handling for appId filtering
   - Added database timeout protection and error handling

7. **Converted `/api/users/route.js`:**
   - Replaced `axios.get(${BE_URL}/api/userlogins/all)` with direct MongoDB access
   - Uses `getApiDatabase(request)` + `getUserLoginsModel()`
   - **Preserved all existing features**: rate limiting, caching, Firebase auth
   - Added database timeout protection matching original 15s timeout
   - Maintained response format compatibility

8. **Converted `/api/organizers/route.js`:**
   - Replaced multiple `axios` proxy calls with direct MongoDB access
   - Uses `getApiDatabase(request)` + `getOrganizersModel()`
   - Converted both GET and POST handlers
   - Added validation error handling and duplicate key detection
   - Preserved all business logic for organizer creation

**Benefits Achieved:**
- ✅ **Environment switching now works** for `/api/users`, `/api/roles`, `/api/organizers`
- ✅ **Performance improvement** through direct database access
- ✅ **Eliminated backend dependency** for user-facing routes
- ✅ **Preserved all existing functionality** (auth, caching, rate limiting)

**Usage Examples:**
```javascript
// Backend usage - connects to TEST (default)
await connectToDatabase();

// API routes now respect environment context
await getApiDatabase(request); // Uses x-db-environment header

// Frontend usage - controlled via UI switcher
// Converted routes automatically switch databases based on environment
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