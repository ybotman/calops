# User Activity Tracking System - Design Document

**Status:** DRAFT
**Author:** Dash (CalOps)
**Date:** 2026-02-20
**Ticket:** TBD (CALOPS-XX)

---

## 1. Overview

A system to track meaningful user actions (not raw clickstream) across all user roles. Enables admins to select a user and view their complete activity history - what they changed, when, and where.

### Goals
- Track significant user actions (CRUD operations, navigation, role changes)
- View activity stream per user in CalOps
- Auto-delete records after 1 year (retention policy)
- Support all roles: NU (Normal User), RO (Regional Organizer), RA (Regional Admin), SU (Super User), SA (System Admin)

### Non-Goals
- Raw clickstream/mouse tracking
- Session replay
- Performance analytics (separate system)

---

## 2. What to Track

### Action Categories

| Category | Actions | Data Captured |
|----------|---------|---------------|
| **Map** | Center changed, Zoom changed | lat/lng, zoom level, city/region |
| **Events** | Create, Update, Delete, View | eventId, changes made, before/after |
| **Venues** | Create, Update, Delete | venueId, changes made |
| **Organizers** | Create, Update, Delete | organizerId, changes made |
| **Users** | Role change, Profile update | userId, old/new role |
| **Auth** | Login, Logout, Session start | IP, device, location |
| **Navigation** | Page visit, Filter change | page, filters applied |
| **Messages** | Send, Read | messageId, recipient |
| **Admin** | Approve organizer, Merge records | action type, affected IDs |

### Action Document Schema

```javascript
{
  _id: ObjectId,

  // Who
  firebaseUID: "abc123",           // Firebase Auth UID
  userLoginId: ObjectId,           // Reference to userlogins collection
  userRole: "RO",                  // Role at time of action
  appId: "1",                      // TangoTiempo or HarmonyJunction

  // What
  category: "events",              // map, events, venues, organizers, users, auth, nav, messages, admin
  action: "update",                // create, read, update, delete, login, logout, navigate, etc.

  // Context
  targetType: "event",             // What was affected
  targetId: "507f1f77bcf86cd799439011",
  targetName: "Milonga at Studio", // Human-readable name

  // Details
  changes: {                       // For updates - what changed
    title: { from: "Old Title", to: "New Title" },
    startDate: { from: "2026-03-01", to: "2026-03-02" }
  },
  metadata: {                      // Additional context
    page: "/dashboard/events",
    filters: { city: "Boston" },
    mapCenter: { lat: 42.36, lng: -71.06 }
  },

  // When/Where
  timestamp: ISODate("2026-02-20T15:30:00Z"),
  ipAddress: "192.168.1.1",        // Optional
  userAgent: "Mozilla/5.0...",     // Optional

  // TTL
  expiresAt: ISODate("2027-02-20T15:30:00Z")  // Auto-delete after 1 year
}
```

---

## 3. Storage Decision: MongoDB vs Firebase

### Option A: MongoDB (RECOMMENDED)

**Pros:**
- ✅ Already using MongoDB for all data
- ✅ Native TTL indexes for auto-expiration
- ✅ Powerful aggregation for analytics
- ✅ Can join with userlogins, events, etc.
- ✅ Single database to manage
- ✅ Cost: Already paying for Atlas

**Cons:**
- ❌ Need to build real-time listeners (if needed)

**TTL Implementation:**
```javascript
// Create TTL index - auto-deletes documents after expiresAt
db.useractivity.createIndex(
  { "expiresAt": 1 },
  { expireAfterSeconds: 0 }
)
```

### Option B: Firebase Firestore

**Pros:**
- ✅ Real-time listeners built-in
- ✅ Direct frontend access possible
- ✅ TTL policies now supported

**Cons:**
- ❌ Another database to manage
- ❌ No native joins with MongoDB data
- ❌ Additional cost
- ❌ Different query patterns
- ❌ Would need to sync user data

### Recommendation: **MongoDB**

Use MongoDB with a new `useractivity` collection. Benefits:
1. Single source of truth
2. Native TTL for 1-year retention
3. Easy joins with existing data
4. Familiar query patterns
5. No additional infrastructure

---

## 4. Backend API Design (BEAF)

### New Azure Function: `UserActivity.js`

#### POST /api/user-activity
Log a new activity event.

```javascript
// Request
{
  "firebaseUID": "abc123",
  "category": "events",
  "action": "update",
  "targetType": "event",
  "targetId": "507f1f77bcf86cd799439011",
  "targetName": "Milonga at Studio",
  "changes": {
    "title": { "from": "Old", "to": "New" }
  },
  "metadata": {
    "page": "/dashboard/events"
  }
}

// Response
{
  "success": true,
  "activityId": "507f1f77bcf86cd799439012"
}
```

#### GET /api/user-activity
Query activity for a user or across users.

```javascript
// Query params
?firebaseUID=abc123           // Required: specific user
&appId=1                       // Optional: filter by app
&category=events              // Optional: filter by category
&action=update                // Optional: filter by action
&startDate=2026-01-01         // Optional: date range
&endDate=2026-02-20
&limit=100                    // Pagination
&offset=0

// Response
{
  "success": true,
  "data": {
    "activities": [...],
    "total": 1234,
    "user": {
      "firebaseUID": "abc123",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "RO"
    }
  }
}
```

#### GET /api/user-activity/summary
Get activity summary/stats for a user.

```javascript
// Response
{
  "success": true,
  "data": {
    "totalActions": 1234,
    "byCategory": {
      "events": 500,
      "map": 300,
      "venues": 200,
      "auth": 234
    },
    "byAction": {
      "create": 100,
      "update": 400,
      "delete": 50,
      "navigate": 684
    },
    "firstActivity": "2025-03-15T10:00:00Z",
    "lastActivity": "2026-02-20T15:30:00Z",
    "activeDays": 180
  }
}
```

---

## 5. CalOps UI Design

### New Page: `/dashboard/user-activity`

#### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  User Activity Tracking                              [Refresh]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [User Search/Select Dropdown_____________________] [App: v]    │
│                                                                 │
│  Selected: John Doe (john@example.com) - Role: RO               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Summary Cards                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   1,234  │ │    500   │ │    180   │ │  Feb 20  │           │
│  │  Actions │ │  Events  │ │   Days   │ │   Last   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  Filters: [Category v] [Action v] [Date Range_____] [Search]   │
├─────────────────────────────────────────────────────────────────┤
│  Activity Stream                                                │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🟢 Feb 20, 3:30 PM  │ EVENTS │ Updated "Milonga at Studio" ││
│  │    Changed: title, startDate                                ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🔵 Feb 20, 3:15 PM  │ MAP    │ Map centered to Boston, MA  ││
│  │    lat: 42.36, lng: -71.06                                  ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🟢 Feb 20, 2:45 PM  │ EVENTS │ Created "New Practica"      ││
│  │    At: MIT Ballroom                                         ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ 🟡 Feb 20, 2:30 PM  │ AUTH   │ Logged in                   ││
│  │    IP: 192.168.1.1, Device: Chrome/Mac                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Load More...]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Color Coding
- 🟢 Green: Create actions
- 🔵 Blue: Read/Navigate actions
- 🟡 Yellow: Update actions
- 🔴 Red: Delete actions
- ⚪ Gray: Auth/System actions

---

## 6. Implementation Plan

### Phase 1: Backend Foundation
1. Create `useractivity` collection in MongoDB
2. Add TTL index for 1-year expiration
3. Create `UserActivity.js` Azure Function (POST, GET)
4. Add activity logging to existing BEAF endpoints

### Phase 2: Integrate Logging
1. Add logging calls to Events CRUD
2. Add logging calls to Venues CRUD
3. Add logging calls to Organizers CRUD
4. Add logging calls to User/Role changes
5. Add auth event logging (login/logout)

### Phase 3: CalOps UI
1. Create User Activity page
2. User search/select component
3. Activity stream with filters
4. Summary cards and stats
5. Export functionality (CSV)

### Phase 4: Frontend Logging (Optional)
1. Add map change tracking (TangoTiempo/HarmonyJunction)
2. Add navigation tracking
3. Add filter/search tracking

---

## 7. Design Decisions (Confirmed)

| Question | Answer |
|----------|--------|
| **Granularity** | Track saved/committed changes only (not every mouse move) |
| **Anonymous users** | Yes, track anonymous visitors too |
| **Real-time** | No WebSocket needed. Refresh button, 1-2 sec response |
| **Export** | Yes, CSV export |
| **Alerts** | Yes, good idea (see alert rules below) |

### Alert Rules (Proposed)

| Alert | Trigger | Severity |
|-------|---------|----------|
| Mass Delete | >5 events deleted in 1 hour | 🔴 High |
| Role Escalation | User role changed to SA/SU | 🟡 Medium |
| Unusual Hours | Admin actions between 2-5 AM | 🟡 Medium |
| New Device | Login from new IP/device | 🔵 Info |
| Rapid Changes | >50 edits in 10 minutes | 🟡 Medium |
| Failed Auth | >3 failed logins | 🔴 High |

---

## 8. Estimated Effort

| Component | Effort |
|-----------|--------|
| MongoDB collection + indexes | 1 hour |
| BEAF endpoints (POST, GET, summary) | 4 hours |
| Integrate logging into existing BEAF | 6 hours |
| CalOps UI page | 8 hours |
| Frontend logging (TT/HJ) | 4 hours |
| Testing | 4 hours |
| **Total** | ~27 hours |

---

## 9. Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | MongoDB | Single DB, native TTL, joins with existing data |
| TTL | 1 year | Per requirements |
| Tracking scope | Actions only | Not raw clickstream - meaningful changes |

---

*Document created by Dash - awaiting Ybotman review*
