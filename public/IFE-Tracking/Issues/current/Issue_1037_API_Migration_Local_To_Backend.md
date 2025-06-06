# Issue 1037: API Migration from Local to Backend

## 🎫 Kanban
- **Created**: 2025-01-06
- **Status**: ✅ Fixed
- **Severity**: High
- **Impact**: All application pages - blocking functionality
- **Branch**: `issue/1037-api-migration`
- **Commits**: 
  - `6abaf8f` - Fix API endpoints to use backend instead of local API
  - `4acd6d7` - Fix StatusPanel to use backend health endpoint

## Description
After removing the local API in favor of using the backend directly, multiple pages are experiencing 404 errors when trying to call localhost:3003 endpoints. All API calls need to be updated to use the backend URL instead of the local API.

## Affected Areas

### 1. Dashboard/Organizers Page
- Working properly (already migrated)
- OrganizerEditForm is receiving data correctly

### 2. Users Page
- **Errors**: 
  - `GET http://localhost:3003/api/users?appId=1` returns 404
  - Multiple failed attempts to fetch users data
  - `Error in usersApi.getUsers: AxiosError`

### 3. Venues Tab
- **Errors**:
  - `GET http://localhost:3003/api/geo-hierarchy?type=countries&appId=1` returns 404
  - Failed to fetch countries data for geo-hierarchy
  - `Error fetching countries: AxiosError`

### 4. Geo-Hierarchy Page
- All geo-hierarchy API calls failing with 404 errors

### 5. Events Page
- **Errors**:
  - `GET http://localhost:3003/api/geo-hierarchy?type=all&appId=1` returns 404
  - `GET http://localhost:3003/api/venues?appId=1` returns 404
  - `Error loading lookup data: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
  - Events not loading properly

## Root Cause
The application is still trying to call the removed local API at `http://localhost:3003` instead of using the backend URL. Based on the be-info/README.md, the backend endpoints should be:
- TEST: `https://calendarbe-test-bpg5caaqg5chbndu.eastus-01.azurewebsites.net`
- PROD: TBD

## Tasks
- [x] ✅ Update API client configuration to use backend URL
- [x] ✅ Update Users API endpoints
- [x] ✅ Update Venues API endpoints  
- [x] ✅ Update Geo-Hierarchy API endpoints
- [x] ✅ Update Events API endpoints
- [x] ✅ Update StatusPanel to use backend health endpoint
- [x] ✅ Test all pages to ensure proper data loading
- [x] ✅ Update environment configuration for backend URLs

---

## 🔬 Scout

### Investigation
Investigated the error patterns across multiple pages. All errors stem from API calls to `localhost:3003` which is the removed local API. The backend is available at the Azure-hosted URL.

### Files to Update
Need to identify and update:
- API client configuration files
- Environment variables
- Any hardcoded localhost:3003 references

---

## 🔨 Builder

### Implementation Plan
1. Update API base URL configuration
2. Replace all localhost:3003 references with backend URL
3. Ensure proper environment variable usage
4. Test each page for proper functionality

### Progress
- [x] API client configuration updated
- [x] Users page fixed - Updated to use /api/userlogins/all
- [x] Venues page fixed - Already using correct backend URL
- [x] Geo-hierarchy fixed - Updated to use /api/masteredLocations/*
- [x] Events page fixed - Updated to use proper API clients

### Implementation Details
1. Users API: Changed from local /api/users to backend /api/userlogins/all
2. Mastered Locations: Changed from /api/geo-hierarchy to /api/masteredLocations
3. All API clients now use NEXT_PUBLIC_BE_URL environment variable
4. Removed all direct axios calls in favor of centralized API clients
5. StatusPanel: Changed from local /api/status to backend /health endpoint

### Resolution
All pages are now successfully connecting to the backend API. The application no longer attempts to call the removed local API at localhost:3003. All API requests are properly routed to the backend URL specified in NEXT_PUBLIC_BE_URL.

---

🔷 **S - Summarize**: Created Issue 1037 to track the API migration from local to backend. All pages except Organizers are experiencing 404 errors due to calling the removed local API at localhost:3003.

🟡 **N - Next Steps**: 
- Switch to Scout role to investigate the API client configuration
- Identify all files that need updating
- Create a comprehensive fix plan

🟩 **R - Request Role**: Request **Scout** role to investigate the codebase and locate all API configuration files that need updating.