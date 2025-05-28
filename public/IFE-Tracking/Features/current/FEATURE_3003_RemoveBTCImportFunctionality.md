# FEATURE_3003_RemoveBTCImportFunctionality

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-28 23:10

- [ ] Remove Events BTC import functionality and UI button
- [ ] Remove Venues BTC import functionality and UI button  
- [ ] Remove Organizers BTC import functionality and UI button
- [ ] Remove BTC import API routes from backend proxy calls
- [ ] Remove BTC import related components and utilities
- [ ] Remove BTC import scripts from project
- [ ] Clean up import result files and logs
- [ ] Update navigation and UI to remove BTC import options
- [ ] Test application functionality without BTC import features
- [ ] Document BTC import functionality removal

## 🧭 SCOUT (Required)
_Research, discoveries, risks, and open questions.  
Document findings and recommendations here._  
**Last updated:** 2025-01-28 23:10

**BTC Import Components to Remove:**

**API Routes:**
- `/api/events/import-btc/` - Events BTC import endpoint
- `/api/venues/import-btc/` - Venues BTC import endpoint  
- `/api/organizers/import-btc/` - Organizers BTC import endpoint

**UI Components:**
- BTC import buttons in Events page/tabs
- BTC import buttons in Venues page
- BTC import buttons in Organizers page
- BTC import dialog components
- BTC import status/progress indicators

**Files/Scripts to Investigate:**
- `btc-import.js` (root level)
- `scripts/btc-import/` directory
- `import-results/` directory with BTC import logs
- BTC import related PMR documents in `public/pmr/`

**Frontend Components:**
- Event BTC import tab (`BtcImportTab.js`)
- Organizer BTC import tab (`BtcOrganizerTab.js`)
- Import dialog components
- BTC import utility functions

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-28 23:10

**Architecture Decision: Remove BTC Import Functionality - APPROVED**

**Removal Strategy:**
1. **UI First**: Remove all BTC import buttons and user interface elements
2. **API Routes**: Remove backend proxy calls to BTC import endpoints
3. **Components**: Remove BTC import dialog and tab components
4. **Scripts**: Remove or archive BTC import scripts
5. **Clean Files**: Remove import result files and logs
6. **Documentation**: Update or archive BTC import related documentation

**Scope of Removal:**
- **Events BTC Import**: Remove import functionality for events from BTC source
- **Venues BTC Import**: Remove import functionality for venues from BTC source  
- **Organizers BTC Import**: Remove import functionality for organizers from BTC source

**Preservation:**
- Keep core Events, Venues, Organizers management functionality
- Preserve standard CRUD operations
- Maintain existing data (only remove import capability)

**Benefits:**
- Simplified UI and user experience
- Reduced codebase complexity
- Elimination of unused/problematic import functionality
- Cleaner admin interface

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-28 23:10

**Implementation pending...**

---

## Summary
Remove BTC (Berlin Tango Calendar) import functionality including UI buttons, API routes, and related components from Events, Venues, and Organizers management.

## Motivation
- Simplify admin interface by removing unused import functionality
- Reduce codebase complexity and maintenance burden
- Eliminate problematic or outdated import features
- Improve user experience with cleaner, focused functionality

## Scope
- **In-Scope:** Remove BTC import buttons, API calls, components, and scripts
- **Out-of-Scope:** Core Events/Venues/Organizers CRUD functionality, existing data

## Feature Behavior
| Area       | Behavior Description                                  |
|------------|--------------------------------------------------------|
| UI         | Remove BTC import buttons from Events, Venues, Organizers pages |
| API        | Remove BTC import API route calls                     |
| Backend    | Clean up BTC import endpoints (if not used elsewhere) |
| Integration | Simplified admin workflows without import options     |

## Tasks
| Status         | Task                                | Last Updated  |
|----------------|-------------------------------------|---------------|
| ⏳ Pending      | Remove Events BTC import button and functionality    | 2025-01-28    |
| ⏳ Pending      | Remove Venues BTC import button and functionality    | 2025-01-28    |
| ⏳ Pending      | Remove Organizers BTC import button and functionality| 2025-01-28    |
| ⏳ Pending      | Remove BTC import API route calls                     | 2025-01-28    |
| ⏳ Pending      | Remove BTC import related components                  | 2025-01-28    |
| ⏳ Pending      | Clean up BTC import scripts and files                | 2025-01-28    |
| ⏳ Pending      | Test application without BTC import features         | 2025-01-28    |

## Rollback Plan
- Keep removed code in git history for potential restoration
- Document what was removed for future reference
- Maintain database schema (only remove UI/API functionality)

## Dependencies
- Events, Venues, Organizers page components
- Admin interface navigation
- Backend API routes (for removal)

## Linked Issues / Docs
- Related to BTC import PMR documents
- Addresses user interface simplification
- Supports admin workflow optimization

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
- Branch: `feature/3003-remove-btc-import-functionality`
- Started from: `DEVL`
- Target merge: `DEVL` after completion and testing