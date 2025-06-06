# Issue 1039: Environment Branch Synchronization

## 🎫 Kanban
- **Created**: 2025-01-06
- **Status**: ⏳ Pending
- **Severity**: High
- **Impact**: TEST and PROD environments not working properly
- **Branch**: Not created yet

## Description
After completing Issue 1037 (API Migration from Local to Backend), the development environment is working correctly but TEST and PROD environments appear to be out of sync. The login functionality was initially broken after removing the local API in favor of NEXT_PUBLIC_BE_URL, and while it seems to be fixed in DEVL, the fix has not been properly propagated to TEST and PROD branches.

## Symptoms
- Development environment (DEVL) is working properly with backend API integration
- TEST environment appears to be non-functional
- PROD environment appears to be non-functional
- Only dev seems to work after the API migration

## Root Cause Analysis
Based on investigation:
1. Recent commits show API migration was completed in DEVL (Issue 1037)
2. Key files differ between branches:
   - `src/app/dashboard/components/StatusPanel.js`
   - `src/middleware.js`
3. The .env files show NEXT_PUBLIC_BE_URL is configured correctly for TEST backend
4. Possible causes:
   - Incomplete merge from DEVL to TEST/PROD
   - Environment-specific configuration not properly set in deployed environments
   - Missing commits in TEST/PROD branches

## Current Configuration
- **Backend URL (TEST)**: `https://calendarbe-test-bpg5caaqg5chbndu.eastus-01.azurewebsites.net`
- **Local Port**: 3003
- **Environment**: Uses NEXT_PUBLIC_BE_URL for all API calls (no more local API)

## Tasks
- [x] ✅ Compare commit history between DEVL, TEST, and PROD branches
- [x] ✅ Identify missing commits in TEST and PROD
- [ ] ⏳ Merge latest DEVL changes to TEST branch
- [ ] ⏳ Test login and all pages in TEST environment
- [ ] ⏳ Merge TEST to PROD after verification
- [ ] ⏳ Verify environment variables in Vercel for deployed environments
- [ ] ⏳ Document merge events according to MergeEvents.md playbook

## Related Issues
- Issue 1037: API Migration from Local to Backend (completed)
- Issue 1035: CalOps Local Backend Connection Refused
- Issue 1036: Firebase Authentication Error

---

## 🧭 Scout

### Investigation Results

The branches appear to be largely synchronized based on commit history:

**DEVL Branch (latest)**:
- `ab686d8` Fix organizer management and add alternate Firebase users feature
- `f9d7ef4` Merge issue/1037-api-migration: Fix API migration from local to backend

**TEST Branch**:
- Has all DEVL commits PLUS additional fixes:
- `9f3b06d` Fix React hydration warnings and update middleware auth cookie
- `c13a6f5` Merge branch 'DEVL' into TEST

**PROD Branch**:
- Has all TEST commits:
- `9f0c1fc` Merge branch 'TEST' into PROD
- `9f3b06d` Fix React hydration warnings and update middleware auth cookie

### Key Differences Found

1. **StatusPanel.js**: TEST/PROD have React hydration fixes (using `<>` instead of `<Box component="span">`)
2. **middleware.js**: TEST/PROD use `authenticated` cookie instead of `auth_token`

### Analysis
The issue is not that TEST/PROD are behind DEVL, but rather they have additional fixes that aren't in DEVL. This suggests:
1. Fixes were made directly in TEST branch without being backported to DEVL
2. The authentication cookie name change might be causing login issues

---

🔷 **S - Summarize**: Investigation reveals TEST and PROD are actually ahead of DEVL with React hydration fixes and different auth cookie names. The branches diverged rather than being out of sync.

🟡 **N - Next Steps**: 
- Backport the React hydration and auth cookie fixes from TEST to DEVL
- Verify which auth cookie name is correct for the current backend
- Test login functionality with proper cookie configuration

🟩 **R - Request Role**: Request **Architect** role to design the proper fix strategy for branch synchronization and authentication issues.