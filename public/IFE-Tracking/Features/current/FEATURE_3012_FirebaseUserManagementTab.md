# FEATURE_3012_FirebaseUserManagementTab

> **IFE Feature Document**  
> This document is the single source of truth for capturing all decisions, actions, and status updates related to this feature.  
> **Guild roles** must update this file directly, in their own sections, using their role icon and a datetime stamp.  
> All recommendations, decisions, and assignments must be recorded here by the responsible role.

## Overview
Add a "Firebase" tab to User Management that displays all Firebase users with their complete information, shows match/unmatch status with userlogins (MongoDB), and provides linking capabilities via Firebase ID.

## 🗂️ KANBAN (Required)
_What must be done, who is assigned, and current status.  
All task assignments and workflow status updates go here._  
**Last updated:** 2025-01-06 15:15

- [x] Create Feature_3012_FirebaseUserManagementTab.md document
- [ ] Design Firebase tab UI layout and functionality
- [ ] Create API endpoint /api/firebase-users to fetch Firebase users
- [ ] Build Firebase tab component with match/unmatch display
- [ ] Add linking functionality between Firebase users and userlogins
- [ ] Test Firebase user management functionality

## 🧭 SCOUT (Required)
_Research, discoveries, risks, and open questions.  
Document findings and recommendations here._  
**Last updated:** 2025-01-06 15:15

- **Current Issue:** User Management delete only affects MongoDB, not Firebase
- **Research Needed:** Firebase Admin SDK capabilities for user listing
- **Questions:** 
  - How to efficiently match Firebase users with userlogins?
  - Should we provide Firebase user deletion capabilities?
  - What Firebase user properties should be displayed?

## 🏛️ ARCHITECT (Required)
_User-approved decisions, technical recommendations, and rationale.  
Document all architectural notes and user approvals here._  
**Last updated:** 2025-01-06 15:30

### Architecture Design

**1. Tab Structure Enhancement:**
- Add "Firebase" as 4th tab (index 3) to existing UserTabNavigationBar
- Tabs: "All Users" (0), "Organizers" (1), "Admins" (2), "Firebase" (3)
- Firebase tab uses separate data source and component

**2. API Endpoint Design:**
- **Route:** `/api/firebase-users` 
- **Method:** GET with query params: `?appId=1&maxResults=1000`
- **Response:** Array of Firebase users with match status
- **Firebase Admin SDK:** Use `admin.auth().listUsers()` method
- **Data Structure:**
  ```javascript
  {
    firebaseUsers: [
      {
        uid: "firebase_uid",
        email: "user@example.com", 
        displayName: "User Name",
        creationTime: "2024-01-01T00:00:00Z",
        lastSignInTime: "2024-01-05T12:00:00Z",
        disabled: false,
        matchStatus: "matched" | "unmatched",
        userLoginId: "mongo_object_id" | null
      }
    ]
  }
  ```

**3. Component Architecture:**
- **FirebaseUsersTable:** New component extending UserTable patterns
- **FirebaseUserDialog:** For viewing Firebase user details
- **Match/Unmatch Logic:** Client-side comparison by firebaseUserId
- **Integration:** Add to UsersPage as TabPanel index 3

**4. Data Flow:**
- Firebase Admin SDK → `/api/firebase-users` → FirebaseUsersHook → FirebaseUsersTable
- Match logic: Compare Firebase users with existing userlogins by uid
- Real-time status: Refresh when switching to Firebase tab

**5. User Experience:**
- Filter buttons: All, Matched, Unmatched
- Action buttons: View Details, Link to UserLogin (for unmatched)
- Visual indicators: ✓ (green) for matched, ⚠ (orange) for unmatched
- Search capability across Firebase user properties

## 🛠️ BUILDER (Required)
_Implementation details, blockers, and technical choices.  
Document what was built, how, and any issues encountered._  
**Last updated:** 2025-01-06 15:45

### Backend Requirements (calendar-be)

**REQUIRED: Add to `/be-info/routes/serverFirebase.js`**

```javascript
// GET /api/firebase/users - List all Firebase users with matching status
router.get('/users', async (req, res) => {
  try {
    const { appId = '1', maxResults = 1000 } = req.query;
    
    // Fetch Firebase users using admin.auth().listUsers()
    let firebaseUsers = [];
    let nextPageToken;
    
    do {
      const result = await admin.auth().listUsers(Math.min(1000, maxResults), nextPageToken);
      firebaseUsers = firebaseUsers.concat(result.users.map(user => ({
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        phoneNumber: user.phoneNumber || null,
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime,
        // Connection methods
        providerData: user.providerData.map(p => ({
          providerId: p.providerId,
          uid: p.uid,
          email: p.email
        })),
        primaryProvider: user.providerData[0]?.providerId || 'unknown'
      })));
      nextPageToken = result.pageToken;
    } while (nextPageToken && firebaseUsers.length < maxResults);
    
    // Fetch userlogins for matching
    const userLogins = await UserLogins.find({ appId }).lean();
    const userLoginMap = new Map(userLogins.map(u => [u.firebaseUserId, u]));
    
    // Add match status
    const usersWithStatus = firebaseUsers.map(fbUser => ({
      ...fbUser,
      matchStatus: userLoginMap.has(fbUser.uid) ? 'matched' : 'unmatched',
      userLoginId: userLoginMap.get(fbUser.uid)?._id || null
    }));
    
    res.json({
      firebaseUsers: usersWithStatus,
      stats: {
        total: usersWithStatus.length,
        matched: usersWithStatus.filter(u => u.matchStatus === 'matched').length,
        unmatched: usersWithStatus.filter(u => u.matchStatus === 'unmatched').length
      }
    });
  } catch (error) {
    console.error('Firebase users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Firebase users' });
  }
});
```

**REQUIRED: Update `/be-info/server.js` to include route**
```javascript
// Add this line with other route registrations
app.use('/api/firebase', require('./routes/serverFirebase'));
```

**Dependencies Met:**
- ✅ Firebase Admin SDK already configured in `/lib/firebaseAdmin.js`  
- ✅ UserLogins model already available in `/models/userLogins.js`
- ✅ Base route structure exists in `/routes/serverFirebase.js`
- ✅ Backend endpoint implemented and available at `/api/firebase/users`

### Frontend Implementation Completed

**Components Created:**
- ✅ `FirebaseUsersTable.js` - Main table component with authentication provider icons
- ✅ `useFirebaseUsers.js` - Hook for Firebase user data management
- ✅ Updated `UserTabNavigationBar.js` to include Firebase tab
- ✅ Updated `UsersPage.js` with Firebase tab integration
- ✅ Frontend API route `/api/firebase-users` to proxy backend calls

**Features Implemented:**
- ✅ Display Firebase users with email, display name, auth method
- ✅ Show connection methods (Google, email/password, phone) with icons
- ✅ Match status indicators (✓ matched, ⚠ unmatched)
- ✅ Stats summary showing total, matched, unmatched counts
- ✅ Action buttons for viewing details and linking users
- ✅ Refresh functionality and error handling
- ✅ Build validation passed

---

## Summary
Create a new "Firebase" tab in User Management that provides comprehensive Firebase user administration capabilities, including viewing all Firebase users, identifying which ones have corresponding userlogins records, and enabling proper user lifecycle management.

## Motivation
Current User Management only shows MongoDB userlogins data. When users are "deleted" via the interface, they're only removed from MongoDB but remain in Firebase. This creates:
- Orphaned Firebase users
- Inability to see complete user picture
- No way to identify unmatched Firebase users
- Confusion about actual user deletion vs. userlogins deletion

## Scope
**In-Scope:**
- New "Firebase" tab in User Management page
- Display all Firebase users with complete information
- Show match/unmatch status with userlogins
- Link Firebase users to userlogins via Firebase ID
- Visual indicators for matched/unmatched users

**Out-of-Scope:**
- Firebase user deletion (security consideration)
- Firebase user creation via admin interface
- Bulk operations on Firebase users

## Feature Behavior
| Area       | Behavior Description                                  |
|------------|--------------------------------------------------------|
| UI         | New "Firebase" tab in User Management with DataGrid showing Firebase users |
| API        | New /api/firebase-users endpoint using Firebase Admin SDK |
| Backend    | Firebase Admin SDK integration for user listing |
| Integration | Match Firebase users with userlogins by firebaseUserId |

## Design
Firebase Tab Layout:
- DataGrid with columns: UID, Email, Display Name, Creation Date, Last Sign In, Matched Status, Actions
- Filter buttons: All Users, Matched, Unmatched
- Action buttons: View Details, Link to UserLogin
- Status indicators: ✓ Matched, ⚠ Unmatched, 🔗 Link Available

## Tasks
| Status         | Task                                | Last Updated  |
|----------------|-------------------------------------|---------------|
| ✅ Complete    | Create /api/firebase-users endpoint | 2025-01-06    |
| ✅ Complete    | Build Firebase tab UI component     | 2025-01-06    |
| ✅ Complete    | Implement user matching logic       | 2025-01-06    |
| ✅ Complete    | Add Firebase tab to User Management | 2025-01-06    |
| 🚧 In Progress | Test Firebase user display          | 2025-01-06    |

## Rollback Plan
- Remove Firebase tab from User Management
- Remove /api/firebase-users endpoint
- Revert any Firebase Admin SDK changes

## Dependencies
- Firebase Admin SDK (already available)
- User Management page structure
- Existing userlogins API

## Linked Issues / Docs
- Related to user deletion concerns in User Management
- Addresses Firebase/MongoDB sync issues

## Owner
AI Guild (Claude)

## Timeline
| Milestone | Date       |
|-----------|------------|
| Created   | 2025-01-06 |
| First Dev | TBD        |
| Review    | TBD        |
| Completed | TBD        |

---

## Git Integration
Branch: `feature/3012-firebase-user-management-tab`
Target merge: DEVL branch after completion and testing