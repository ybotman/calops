PMR_UsersPageRefactor

Summary

The UsersPage.js file has grown into a monolithic 1,000+ line React component combining UI, data fetching, business logic, and state management. This PMR breaks it into manageable modules, improves testability, and aligns with best practices.

Scope

Includes:

Refactoring UsersPage.js into smaller components and hooks

Extracting API calls and business logic

Improving pagination, filtering, and retry logic

Adding PropTypes and preparatory steps for TypeScript migration

Updating documentation and adding tests

Excludes:

Backend API changes

Third‑party library upgrades

Motivation

Enhance maintainability and readability

Enable isolated unit testing

Facilitate incremental feature additions

Reduce cognitive load and merge conflicts

Changes

Frontend: Modularize UI into components (TabPanel, DataGrid, Dialogs)

Hooks: Create custom hooks for data fetching and filtering

Services: Move Axios calls to api-client service

Testing: Add unit and Cypress tests

Documentation: Update README and code comments

Risks & Mitigations

Risk

Mitigation

Breaking existing UI or logic

Add comprehensive unit/E2E tests before deployment

Merge conflicts with ongoing work

Coordinate with teams and lock file during migration

Delayed release due to refactors

Keep refactors incremental and reversible

Rollback Strategy

Revert to the previous UsersPage.js commit

Restore the monolithic component

Dependencies

@mui/material and @mui/x-data-grid versions remain unchanged

Existing usersApi and rolesApi endpoints

Cypress setup for E2E tests

Linked PMRs

Backend PMRs: http://localhost:3010/public/PMR_Geolocation_Hierarchy/

TangoTiempo PMRs: http://localhost:3001/public/PMR_EventRefactor/

Owner

Frontend Team / @tobybalsley

Timeline

Start: 2025-04-24

Phase Completion Target: 2025-05-08

Final Review: 2025-05-10

Post-Migration Tasks

Monitor production errors

Collect performance metrics

Update engineering handbook

Phase 1: Analyze & Plan

Goals

Identify logical boundaries and module candidates within UsersPage.js.

Tasks

Status

Task

Last Updated

⏳ Pending

Review component and map responsibilities

-

⏳ Pending

Document areas with high complexity (e.g., refreshUsers)

-

⏳ Pending

Define component and hook boundaries

-

Rollback (if needed)

No changes applied; original file remains intact.

Notes

Keep notes on candidate module names (e.g., useUsers, UsersTable).

Phase 2: Extract UI Components

Goals

Move presentational logic into TabPanel, UsersTable, and dialog components.

Tasks

Status

Task

Last Updated

⏳ Pending

Create TabPanel component file

-

⏳ Pending

Extract DataGrid setup into UsersTable component

-

⏳ Pending

Extract UserEditForm and AddUserDialog components

-

Rollback (if needed)

Revert component imports and inline logic back into UsersPage.js.

Notes

Ensure all PropTypes are applied after extraction.

Phase 3: Extract Business Logic & Hooks

Goals

Isolate data fetching, pagination, filtering, and CRUD operations into custom hooks and services.

Tasks

Status

Task

Last Updated

⏳ Pending

Move refreshUsers and related logic into useUsers hook

-

⏳ Pending

Refactor handleSearchChange and filterUsers into useUserFilter

-

⏳ Pending

Relocate Axios calls from component to api-client service

-

Rollback (if needed)

Re-inline hook logic into UsersPage.js.

Notes

Maintain existing retry and debounce behaviors.

Phase 4: Enhance Pagination & Filtering

Goals

Implement server-side pagination and optimize search performance.

Tasks

Status

Task

Last Updated

⏳ Pending

Switch DataGrid to serverPagination mode

-

⏳ Pending

Update backend query parameters for page/size

-

⏳ Pending

Move debounce logic into hook with customizable delay

-

Rollback (if needed)

Toggle back to client-side pagination settings.

Notes

Coordinate with backend team for API contract.

Phase 5: Add PropTypes & Prep for TS

Goals

Ensure type safety and prepare for a future TS migration.

Tasks

Status

Task

Last Updated

⏳ Pending

Add PropTypes to all extracted components

-

⏳ Pending

Create TS declaration files for hooks and services

-

Rollback (if needed)

Remove PropTypes additions.

Notes

PropTypes serve as runtime checks until TS is adopted.

Phase 6: Testing & Validation

Goals

Cover refactored code with unit tests and Cypress E2E tests.

Tasks

Status

Task

Last Updated

⏳ Pending

Write unit tests for useUsers and useUserFilter

-

⏳ Pending

Add Cypress tests for table filtering and dialogs

-

Rollback (if needed)

Revert to previous test suite.

Notes

Aim for >80% coverage on new modules.

Phase 7: Documentation & Release

Goals

Finalize docs and deploy to staging.

Tasks

Status

Task

Last Updated

⏳ Pending

Update README.md with component and hook usage

-

⏳ Pending

Draft release notes detailing refactor changes

-

⏳ Pending

Merge feature branch and deploy to staging

-

Rollback (if needed)

Revert release merge commit.

Notes

Coordinate release window to minimize user impact.

