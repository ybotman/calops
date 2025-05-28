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
**Last updated:** 2025-01-28 16:30

**Current MongoDB Implementation:**
- Located in `/src/lib/mongodb.js`
- Uses single `MONGODB_URI` environment variable
- Hardcoded connection to TEST database (TangoTiempo)
- Connection is cached globally for performance
- Used by 6+ files including scripts and API routes

**Environment Variables Available:**
- `MONGODB_URI` - Currently points to TEST database (TangoTiempo)
- `MONGODB_URI_PROD` - Available but not used in code

**Risk Assessment:**
- Need to ensure environment switching doesn't break existing functionality
- Cache invalidation required when switching environments
- Scripts in `/scripts/` folder also use MongoDB connections

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-28 16:45

**Architecture Design:**
1. **Environment Selection Mechanism:**
   - Add optional `environment` parameter to `connectToDatabase()` function
   - Default to 'test' environment for backward compatibility
   - Support 'test' and 'prod' environment values

2. **Connection URI Selection:**
   - `environment === 'prod'` → uses `MONGODB_URI_PROD`
   - `environment === 'test'` (default) → uses `MONGODB_URI`

3. **Cache Management:**
   - Separate cache per environment: `{ test: {conn, promise}, prod: {conn, promise} }`
   - Prevents cross-contamination between environments

4. **Function Signature:**
   - `async function connectToDatabase(environment = 'test')`
   - Maintains backward compatibility (existing code unchanged)

**Environment Variables:**
- `MONGODB_URI` = TangoTiempo (TEST database) ✓
- `MONGODB_URI_PROD` = TangoTiempoProd (PROD database) ✓

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

3. **Backward Compatibility:**
   - All existing code continues to work unchanged (defaults to TEST)
   - No breaking changes introduced

**Usage Examples:**
```javascript
// Existing code - connects to TEST (default)
await connectToDatabase();

// Explicit TEST connection  
await connectToDatabase('test');

// PROD connection when needed
await connectToDatabase('prod');
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
| 🚧 In Progress | Test functionality with both environments | 2025-01-28 |

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