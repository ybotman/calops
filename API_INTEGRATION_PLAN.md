# API Integration Plan: Backend Integration for CalOps

This document outlines the approach to migrating the CalOps application to properly use the central calendar-be backend API instead of direct database connections.

## Overview

CalOps is currently using mixed approaches for data access:
1. Some features use the central backend API (via api-client.js)
2. Other features (particularly Events) attempt direct MongoDB connections
3. This inconsistency is causing 500 errors and maintenance challenges

## Backend API Structure

Important the Backend Code you gave access to in the link ./be-info.  IF you cannot see this folder tell me and i will recreate.

1. **Main Events Endpoints**:
   - `GET /api/events` - List events with filters (pagination, date range, location)
   - `GET /api/events/id/:id` - Get single event by ID
   - `POST /api/events/post` - Create event (requires authentication)
   - `PUT /api/events/:eventId` - Update event (requires authentication)
   - `DELETE /api/events/:eventId` - Delete event (requires authentication)

2. **Venues Endpoints**:
   - `GET /api/venues` - List venues with pagination and filtering
   - `GET /api/venues/:id` - Get a specific venue by ID
   - `POST /api/venues` - Create a new venue
   - `PUT /api/venues/:id` - Update a venue
   - `DELETE /api/venues/:id` - Delete a venue
   - `GET /api/venues/nearest-city` - Find nearest city to coordinates

3. **Geo Hierarchy Endpoints**:
   - `GET /api/masteredLocations/countries` - List all countries
   - `GET /api/masteredLocations/regions` - List regions (filtered by country)
   - `GET /api/masteredLocations/divisions` - List divisions (filtered by region)
   - `GET /api/masteredLocations/cities` - List cities (filtered by division)

4. **Required Parameters**:
   - `appId` - Required for all endpoints
   - Authentication - Required for POST, PUT, DELETE operations

## Testing Process

After each phase, we'll test the application using:

```bash
# Start the development server on port 3003
npm run dev

# In a separate terminal, verify the backend is running
curl http://localhost:3010/health

# Test the events API directly
curl "http://localhost:3010/api/events?appId=1&masteredRegionName=Northeast"

# Build the app to verify no compilation errors
npm run build
```

## Implementation Status

### ✅ Completed

1. **Events API Proxying**
   - [x] Convert `/api/events/route.js` to proxy pattern
   - [x] Convert `/api/events/[id]/route.js` to proxy pattern
   - [x] Ensure all appId validation is consistent
   - [x] Create interface for Event model
   - [x] Verified events page now correctly displays event data

2. **Geo-Hierarchy API Proxying**
   - [x] Convert `/api/geo-hierarchy/route.js` to proxy pattern
   - [x] Convert `/api/geo-hierarchy/[type]/[id]/route.js` to proxy pattern
   - [x] Ensure all appId validation is consistent
   - [x] Create interfaces for geo-hierarchy models
   - [x] Verified geo-hierarchy page now correctly displays cities, divisions, and regions

3. **Venues API Proxying** - ✅ COMPLETED
   - [x] Convert `/api/venues/route.js` to proxy pattern
   - [x] Convert `/api/venues/[id]/route.js` to proxy pattern
   - [x] Convert `/api/venues/nearest-city/route.js` to proxy pattern
   - [x] Create interface for Venue model
   - [ ] Verify venues page correctly displays venue data with API

4. **Comprehensive Testing**
   - [x] Test event CRUD operations
   - [x] Test geo-hierarchy operations with appId parameter
   - [x] Test venues operations
   - [x] Build application and verify no compile errors

### 🔄 In Progress

1. **Remove Locations API & Use Venues API Only** ✅ (Completed!)
   - [x] Removed `/api/locations` directory completely
   - [x] Confirmed existing Venues API (`/api/venues`) is working correctly
   - [x] Removed deprecated locations code
   - [x] Simplified system to use only the Venues concept for physical locations

2. **Model Refinement**
   - [ ] Ensure all interfaces match backend models
     - Current interfaces (e.g., `Event.js`) need to be aligned with backend models
     - Add interfaces for Venue, Organizer, User, and other core entities
   - [ ] Update all direct database references to use APIs
     - Multiple API routes still use direct MongoDB connections
     - Many debug endpoints use direct database access
     - Organizer connection has MongoDB fallback logic
   - [ ] Implement consistent error handling across all APIs
     - Current implementation has inconsistent error handling
     - Some routes have detailed error handling, others minimal
     - Need standardized approach for API failures and fallbacks

### 📝 Next Steps

1. **Eliminate Direct Database Access in API Routes**
   - [x] Convert venue API routes to backend proxies:
     - [x] `/api/venues/route.js` to proxy to backend API
     - [x] `/api/venues/[id]/route.js` to proxy to backend API
     - [x] `/api/venues/nearest-city/route.js` to proxy to backend API
   - [x] Convert organizer API routes to backend proxies:
     - [x] `/api/organizers/route.js` to proxy to backend API
     - [x] `/api/organizers/[id]/route.js` already used API approach
     - [x] `/api/organizers/[id]/connect-user/route.js` to proxy to backend API
   - [x] Convert geo-hierarchy API routes to backend proxies:
     - [x] `/api/geo-hierarchy/route.js` to proxy to backend API
     - [x] `/api/geo-hierarchy/[type]/[id]/route.js` to proxy to backend API
   - [ ] Convert or consolidate debug endpoints

2. **Create Simple API Utility Functions (No Large Abstraction)**
   - [ ] Create simple helper functions for common API operations
     - [ ] Shared error handling for Axios requests
     - [ ] Standard response formatting
   - [ ] Allow components to continue using direct Axios
   - [ ] Document standard patterns for API calls

3. **Interface Standardization**
   - [ ] Create consistent interfaces for all models:
     - [ ] `Venue.js` interface matching backend model (venues.js)
     - [ ] `Organizer.js` interface matching backend model (organizers.js)
     - [ ] `UserLogin.js` interface matching backend model (userLogins.js)
     - [ ] `Role.js` interface matching backend model (roles.js)
   - [ ] Document interfaces with JSDoc comments
   - [ ] Update API routes to return consistently formatted data

4. **Error Handling Improvements**
   - [ ] Add consistent error handling in API route proxies:
     - [ ] Properly forward error codes from backend
     - [ ] Add meaningful error messages
     - [ ] Log API failures appropriately
   - [ ] Create simple error handling components for UI

5. **Remove API Abstraction and Direct Database Dependencies**
   - [ ] Replace complex API client pattern with simpler direct Axios approach
     - [ ] Identify components using the API client abstraction
     - [ ] Gradually migrate to direct Axios calls with shared patterns
     - [ ] Remove or simplify overly complex parts of api-client.js
   - [ ] Clean up or remove `/lib/mongodb.js` after all routes are converted
   - [ ] Remove MongoDB imports from all files
   - [ ] Delete any direct database model definitions
   - [ ] Remove other unused database dependencies

6. **Testing and Verification**
   - [ ] Test all API routes with backend running
   - [ ] Test API routes with backend unavailable (verify error handling)
   - [ ] Test components with actual API data
   - [ ] Final build and deployment verification

## API Implementation Details

### Venue API (replacing Locations)

The Venues API properly replaces the Locations functionality. The old Locations collection has been deprecated in favor of Venues. All features that previously used locations should be updated to use venues instead. The Venues API supports all the same operations but with a more consistent data model that integrates better with the geo-hierarchy.

### Deprecation Plan for Locations API

1. **Short-term**: Add deprecation warnings and redirect to venues API
2. **Medium-term**: Update all UIs to use venues instead of locations
3. **Long-term**: Remove locations API endpoints entirely

## Recommendations

1. **Model Standardization**
   - Apply the interface pattern to all models
   - Create proper TypeScript interfaces for all models
   - Implement schema validation for data safety

2. **Error Handling Improvements**
   - Add more specific error messages and codes
   - Implement retry mechanisms for transient failures
   - Create error boundary components for UI resilience

3. **Testing Infrastructure**
   - Add integration tests for API interactions
   - Create mock backend for offline development
   - Implement monitoring for API health

4. **Performance Optimization**
   - Implement client-side caching for frequent requests
   - Add pagination for large result sets
   - Optimize data transfer with field selection