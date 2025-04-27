# Issue: Venues Page Refactoring

## Overview
The Venues Management page (`src/app/dashboard/venues/page.js`) is excessively large (2,382 lines) and contains a mixture of UI components, business logic, and API calls. This makes it difficult to maintain, test, and extend. The page needs refactoring to follow best practices for React component architecture, hooks, and API client usage, similar to the approach taken with the User Management page refactoring (Issue #1026).

## Details
- **Reported On:** 2025-04-27
- **Reported By:** Toby Balsley
- **Environment:** All environments
- **Component/Page/API Affected:** Venues Management page (`/src/app/dashboard/venues/page.js`)
- **Symptoms:** 
  - Large monolithic component (2,382 lines)
  - Mixed concerns (UI, state management, API calls)
  - Inconsistent API access patterns (mix of direct axios calls and api-client.js)
  - Duplicated logic for data processing
  - Complex state management
  - Geolocation validation functionality mixed with UI

## Technical Analysis

### Current Issues
1. **Size and Complexity**:
   - The `venues/page.js` file is 2,382 lines long, making it difficult to understand and maintain
   - Contains multiple responsibilities that should be separated
   - More complex than the Users page due to geographic hierarchies and validation

2. **Inconsistent API Access**:
   - Some API calls use the centralized API client
   - Others make direct axios calls to the backend or local Next.js API routes
   - This inconsistency makes it harder to implement global error handling and caching

3. **Mixed UI and Logic**:
   - UI rendering, data fetching, and business logic are tightly coupled
   - Error handling is scattered throughout the component
   - Geolocation validation and BTC import logic mixed with rendering

4. **Complex State Management**:
   - Multiple useState hooks managing related state (estimated 23+ useState hooks)
   - Complex state updates with many dependencies
   - No clear separation between UI state and data state
   - Geographic hierarchy states add additional complexity

5. **Limited Code Reuse**:
   - Functionality that could be reused is embedded directly in the component
   - Difficult to test or reuse parts of the implementation
   - Four large dialog components with separate state management

### Proposed Refactoring

1. **Component Structure**:
   - Break down the page into smaller, focused components
   - Create a component hierarchy with clear responsibilities
   - Implement container/presentation pattern where appropriate
   - Extract dialog components into separate files

2. **Custom Hooks**:
   - Extract data fetching and business logic into custom hooks
   - Create dedicated hooks for venue data, filtering, and pagination
   - Implement context providers where appropriate for shared state
   - Develop specialized hooks for geolocation validation

3. **API Client Standardization**:
   - Consistently use the centralized API client for all backend calls
   - Extend the API client to cover all required venues endpoints
   - Add proper error handling and response normalization
   - Standardize geolocation API calls

4. **State Management**:
   - Reorganize state into logical groupings
   - Consider using useReducer for complex state interactions
   - Implement optimistic updates for better UX during edits
   - Separate geographic hierarchy state management

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
- Map complex geolocation and validation flows

### Phase 2: API Client Enhancement
- Update api-client.js to support all required venue operations
- Implement consistent error handling and response formatting
- Add optional caching for frequently accessed data
- Create comprehensive tests for the API client
- Standardize geolocation API access

### Phase 3: Custom Hooks Development
- Implement useVenues hook for venue data management
- Create useVenueFilters hook for search and filtering
- Develop usePagination hook for DataGrid integration
- Add useVenueForm hook for form handling
- Create useGeoValidation hook for location validation

### Phase 4: Component Refactoring
- Create basic component structure
- Split page into logical container components
- Develop presentation components with clear props interfaces
- Extract dialog components into separate files
- Implement responsive UI improvements

### Phase 5: Integration and Testing
- Connect all components using the new hooks
- Implement comprehensive error handling
- Add loading states and error boundaries
- Ensure 100% feature parity with current implementation
- Validate geolocation functionality

## Expected Benefits
- Improved maintainability through smaller, focused components
- Better testability with clear separation of concerns
- Enhanced performance through optimized rendering
- Easier feature additions in the future
- Consistent patterns across Users and Venues pages
- More reliable geolocation validation
- Reduced code duplication

## Fix (if known or applied)
- **Status:** ⏳ Pending
- **Fix Description:** 
  1. Analyze the current implementation and create a refactoring plan
  2. Enhance the API client to support all required venue operations
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
🔷 S — Created a new issue for refactoring the oversized Venues Management page (2,382 lines) to follow best practices, similar to Issue #1026 (Users Page Refactoring). The current page mixes UI components, business logic, and API calls in a way that's difficult to maintain, with additional complexity from geolocation validation functionality. The refactoring will split it into smaller components, extract logic into custom hooks, standardize API client usage, and improve state management.

🟡 N — Next steps:
1. Create a branch for this issue following naming conventions (issue/1027-venues-page-refactoring)
2. Analyze the current implementation to create a component hierarchy
3. Define interface contracts between components
4. Start implementing the refactoring in phases, beginning with API client enhancements

🟩 R — Request Scout role to analyze the current venues page implementation and identify all the key functionality, state management, and API interactions that need to be preserved in the refactoring. This will provide the foundation for developing a comprehensive refactoring plan.