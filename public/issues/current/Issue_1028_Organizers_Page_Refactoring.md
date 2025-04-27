# Issue: Organizers Page Refactoring

## Overview
The Organizers Management page (`src/app/dashboard/organizers/page.js`) is excessively large (1,264 lines) and contains a mixture of UI components, business logic, and API calls. This makes it difficult to maintain, test, and extend. The page needs refactoring to follow best practices for React component architecture, hooks, and API client usage, similar to the approach taken with the User Management page refactoring (Issue #1026) and Venues Page refactoring (Issue #1027).

## Details
- **Reported On:** 2025-04-27
- **Reported By:** Toby Balsley
- **Environment:** All environments
- **Component/Page/API Affected:** Organizers Management page (`/src/app/dashboard/organizers/page.js`)
- **Symptoms:** 
  - Large monolithic component (1,264 lines)
  - Mixed concerns (UI, state management, API calls)
  - Inconsistent API access patterns (mix of direct axios calls and api-client.js)
  - Duplicated logic for data processing
  - Complex state management
  - User-Organizer connection functionality mixed with UI
  - BTC import functionality mixed with UI

## Technical Analysis

### Current Issues
1. **Size and Complexity**:
   - The `organizers/page.js` file is 1,264 lines long, making it difficult to understand and maintain
   - Contains multiple responsibilities that should be separated
   - Complex user-organizer relationship management logic

2. **Inconsistent API Access**:
   - Some API calls use the centralized API client
   - Others make direct axios calls to the backend or local Next.js API routes
   - Contains fallback mechanisms when primary API calls fail
   - This inconsistency makes it harder to implement global error handling and caching

3. **Mixed UI and Logic**:
   - UI rendering, data fetching, and business logic are tightly coupled
   - Error handling is scattered throughout the component
   - BTC import logic mixed with rendering
   - User connection process logic embedded in UI

4. **Complex State Management**:
   - Multiple useState hooks managing related state
   - Complex state updates with many dependencies
   - No clear separation between UI state and data state
   - User-organizer relationship state adds additional complexity

5. **Limited Code Reuse**:
   - Functionality that could be reused is embedded directly in the component
   - Difficult to test or reuse parts of the implementation
   - Dialog components with separate state management

6. **Organizer-Specific Issues**:
   - BTC Import functionality mixes UI and complex data transformation logic
   - Complex user-organizer connection process with multiple fallback methods
   - Inconsistent state management for the import process
   - Special handling for organizer types (isEventOrganizer, isTeacher, isDJ, etc.)

### Proposed Refactoring

1. **Component Structure**:
   - Break down the page into smaller, focused components
   - Create a component hierarchy with clear responsibilities
   - Implement container/presentation pattern where appropriate
   - Extract dialog components into separate files
   - Leverage existing component files in `/src/components/organizers/`

2. **Custom Hooks**:
   - Extract data fetching and business logic into custom hooks
   - Create dedicated hooks for organizer data, filtering, and pagination
   - Implement context providers where appropriate for shared state
   - Develop specialized hooks for user-organizer connection
   - Create a hook for BTC import functionality

3. **API Client Standardization**:
   - Consistently use the centralized API client for all backend calls
   - Extend the API client to cover all required organizer operations
   - Add proper error handling and response normalization
   - Standardize fallback approaches for failed API calls

4. **State Management**:
   - Reorganize state into logical groupings
   - Consider using useReducer for complex state interactions
   - Implement optimistic updates for better UX during edits
   - Separate user-connection state management

5. **Code Organization**:
   - Create a consistent folder structure for components, hooks, and utilities
   - Implement barrel exports (index.js files) for better imports
   - Add proper JSDoc comments for better maintainability
   - Follow patterns established in the Users page refactoring

## Implementation Approach

### Phase 1: Analysis and Planning
- Create a component hierarchy diagram
- Identify all state and data flow requirements
- Define interface contracts between components
- Create a refactoring plan with clear milestones
- Map complex user-organizer connection flows
- Document BTC import process requirements

### Phase 2: API Client Enhancement
- Update api-client.js to support all required organizer operations
- Implement consistent error handling and response formatting
- Add optional caching for frequently accessed data
- Create comprehensive tests for the API client
- Standardize user-organizer connection API access

### Phase 3: Custom Hooks Development
- Implement useOrganizers hook for organizer data management
- Create useOrganizerFilters hook for search and filtering
- Develop usePagination hook for DataGrid integration
- Add useOrganizerForm hook for form handling
- Create useUserOrganizer hook for connecting users to organizers
- Implement useBtcImport hook for import functionality

### Phase 4: Component Refactoring
- Create basic component structure
- Split page into logical container components
- Develop presentation components with clear props interfaces
- Extract dialog components into separate files
- Implement responsive UI improvements
- Leverage and enhance existing organizer components

### Phase 5: Integration and Testing
- Connect all components using the new hooks
- Implement comprehensive error handling
- Add loading states and error boundaries
- Ensure 100% feature parity with current implementation
- Validate user-organizer connection functionality
- Test BTC import process thoroughly

## Expected Benefits
- Improved maintainability through smaller, focused components
- Better testability with clear separation of concerns
- Enhanced performance through optimized rendering
- Easier feature additions in the future
- Consistent patterns across Users, Venues, and Organizers pages
- More reliable user-organizer connection process
- Reduced code duplication
- Cleaner BTC import process

## Fix (if known or applied)
- **Status:** ⏳ Pending
- **Fix Description:** 
  1. Analyze the current implementation and create a refactoring plan
  2. Enhance the API client to support all required organizer operations
  3. Extract business logic into custom hooks
  4. Break down the page into smaller components
  5. Ensure consistent patterns and approach with Users page refactoring

## Resolution Log
- **Commit/Branch:** Not yet created
- **PR:** Not yet created
- **Deployed To:** Not yet deployed
- **Verified By:** Not yet verified

---

# SNR after interactions
🔷 S — Created a new issue for refactoring the oversized Organizers Management page (1,264 lines) to follow best practices, similar to Issues #1026 (Users Page) and #1027 (Venues Page). The current page mixes UI components, business logic, and API calls in a way that's difficult to maintain, with additional complexity from user-organizer connections and BTC import functionality. The refactoring will split it into smaller components, extract logic into custom hooks, standardize API client usage, and improve state management.

🟡 N — Next steps:
1. Create a branch for this issue following naming conventions (issue/1028-organizers-page-refactoring)
2. Analyze the current implementation to create a component hierarchy
3. Define interface contracts between components
4. Start implementing the refactoring in phases, beginning with API client enhancements

🟩 R — Request Scout role to analyze the current organizers page implementation and identify all the key functionality, state management, and API interactions that need to be preserved in the refactoring. This will provide the foundation for developing a comprehensive refactoring plan.