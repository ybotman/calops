# Issue 1036: Firebase Authentication Service Account Error

## KANBAN

**Issue ID**: 1036
**Type**: Issue
**Status**: 🚧 In Progress
**Priority**: High
**Created**: 2025-01-06
**Target Branch**: `issue/1036-firebase-auth-error`

## SCOUT

### Environment
- **Application**: CalOps / Calendar Backend
- **Component**: Firebase Admin SDK
- **Endpoint**: `/api/firebase/users`
- **Environment**: Backend (both local and test environments)

### Symptoms
1. Initial 404 error due to incorrect route path in CalOps
2. After fixing route, Firebase authentication error:
   - "Invalid JWT Signature" 
   - "Credential implementation provided to initializeApp() via the 'credential' property failed to fetch a valid Google OAuth2 access token"

### Steps to Reproduce
1. Navigate to Users page in CalOps
2. Click on "Firebase Users" tab
3. API call fails with authentication error

### Expected Behavior
Firebase users should load successfully showing all Firebase Authentication users

### Actual Behavior
Backend returns 500 error with Firebase authentication failure

## BUILDER

### Investigation Findings
1. **Route Issue (Fixed)**: CalOps had route at `/api/firebase-users` but hook expected `/api/firebase/users`
   - Moved route from `src/app/api/firebase-users/route.js` to `src/app/api/firebase/users/route.js`
2. **Firebase Auth Issue**: Backend Firebase Admin SDK cannot authenticate due to invalid service account credentials

### Root Cause
Firebase service account JSON has invalid JWT signature. Possible causes:
1. Server time not properly synced
2. Certificate key file has been revoked
3. Service account JSON is outdated or corrupted

### Fix Details
**Part 1 - Route Structure (Completed)**
- Moved CalOps route to match expected path: `/api/firebase/users`

**Part 2 - Firebase Service Account (Pending)**
Backend team needs to:
1. Check server time synchronization
2. Verify service account key ID at Firebase Console
3. Regenerate service account JSON if needed
4. Update FIREBASE_JSON environment variable

### Implementation
```bash
# Part 1 - Route fix (completed)
mkdir -p src/app/api/firebase/users
mv src/app/api/firebase-users/route.js src/app/api/firebase/users/route.js
rmdir src/app/api/firebase-users
```

### Testing
1. Verify route is accessible at `/api/firebase/users`
2. Once backend fixes service account, verify Firebase users load
3. Test in both local and deployed environments

### Status Updates
- ✅ Issue identified
- ✅ Route structure fixed
- 🚧 Firebase service account fix pending (backend team)
- ⏳ Testing pending
- ⏳ Deployment pending

### Notes
- This is a backend configuration issue that requires access to Firebase Console
- CalOps frontend is now correctly configured
- Backend needs to update Firebase service account credentials