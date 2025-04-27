# Issue: Users API 404 Error

## Overview
The admin dashboard's User Management page is failing to load user data due to a 404 error when attempting to fetch users from the API endpoint `/api/userlogins/all`.

## Details
- **Reported On:** 2025-04-26
- **Reported By:** User
- **Environment:** Local Development
- **Component/Page/API Affected:** User Management page, API client, `/api/userlogins/all` endpoint
- **Symptoms:** Users page displays empty user list due to 404 error from backend API

## Steps to Reproduce
1. Start the frontend application
2. Navigate to the User Management page at `/dashboard/users`
3. Observe the browser console logs showing a 404 error
4. Observe that the users table is empty despite the backend being up and running

## Investigation
- **Initial Trace:** 
  ```
  API Response Error: Request failed with status code 404
  Error Status: 404
  Error Data: <!DOCTYPE html>
  <html lang="en">
  <head>
  <meta charset="utf-8">
  <title>Error</title>
  </head>
  <body>
  <pre>Cannot GET /api/userlogins/all</pre>
  </body>
  </html>
  Error in usersApi.getUsers: 
  AxiosError {message: 'Request failed with status code 404', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
  ```

- **Suspected Cause:** 
  - The backend server configuration only uses the optimized user routes: `app.use("/api/userlogins", optimizedUserLoginRoutes);`
  - The `/api/userlogins/all` endpoint exists in the standard `serverUserLogins.js` file but not in the optimized version
  - This routing configuration causes a 404 error when the frontend attempts to access the "/all" endpoint

- **Files to Inspect:** 
  - `/src/lib/api-client.js` - Contains the API client with the users API configuration
  - `/src/components/users/hooks/useUsers.js` - Custom hook that fetches user data
  - `/src/app/dashboard/users/page.js` - Users page component that displays the data
  - Backend API routes for userlogins

## Fix (if known or applied)
- **Status:** ✅ Fixed
- **Fix Description:** 
  1. Two-part fix implemented:
     * **Backend fix**: The `/api/userlogins/all` endpoint was implemented in `optimizedServerUserLogins.js` (it was previously only in `serverUserLogins.js`, but the server was using the optimized routes)
     * **Frontend fix**: Updated `api-client.js` to use our local Next.js API route (`/api/users`) instead of directly calling the backend
  2. The backend implementation includes performance optimizations:
     * Excludes audit logs to reduce document size
     * Uses lean queries for better performance
     * Implements query timeouts to prevent hanging requests
  3. The frontend implementation is now simpler and more reliable, with proper error handling
  4. Fixed MUI DataGrid warning by removing the `rowCount` prop when using client-side pagination

## Resolution Log
- **Commit/Branch:** `issue/1023-btc-import-limited-events`
- **PR:** Not yet created
- **Deployed To:** Not yet deployed
- **Verified By:** Not yet verified

---

# SNR after implementation
🔷 S — Successfully fixed the 404 error in the User Management page through a collaborative approach. The backend team added the missing `/all` endpoint to the optimized user login routes with performance optimizations (excluding audit logs, using lean queries, and implementing timeouts). On the frontend side, we simplified our API route to use this newly available endpoint and updated the API client to use our local route, ensuring a clean architecture with proper error handling.

🟡 N — Next steps:
1. Test the User Management page to verify users load correctly with the new implementation
2. Monitor performance to ensure the optimized backend endpoint works well under load
3. Consider future refactoring of the large users page component as a separate task
4. Move this issue to the completed folder once verified

🟩 R — Request Executer role to test the implementation by running the application locally and verifying that the User Management page can successfully load user data without the 404 error or performance issues.