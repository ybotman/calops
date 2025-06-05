# Issue: User Management Display Missing Name and Email

> **IFE Issue Log**  
> This document is the single source of truth for capturing all actions, findings, and status updates related to this issue.  
> Guild roles must update their own section below, using their role icon and a datetime stamp.  
> All investigation, assignments, and fixes must be recorded here by the responsible role.

## Overview
This is a lightweight formal issue log to capture, trace, and resolve a specific bug. It is stored in the `/public/IFE-Tracking/Issues/current/` folder and moved to `/public/IFE-Tracking/Issues/completed/` upon resolution.

## Details
- **Reported On:** 2025-01-06
- **Reported By:** User
- **Environment:** Local/Dev
- **Component/Page/API Affected:** User Management table display
- **Symptoms:** Table shows "Unnamed User" and "No email" but edit form shows correct data (e.g., "Toby Balsley")

## Steps to Reproduce
1. Navigate to User Management page
2. Observe table entries showing "Unnamed User" and "No email"
3. Click edit on any user
4. Notice correct name appears in edit form (e.g., "Toby Balsley")
5. Confirm data discrepancy between table view and edit view

---

## 🗂️ KANBAN (Required)
_Tracks assignments, status, and workflow for this issue.  
All task assignments and status updates go here._  
**Last updated:** 2025-01-06 14:30

- [x] Create issue document Issue_1034_UserManagementDisplayMissing.md
- [ ] Investigate table data fetching vs edit form data fetching
- [ ] Identify root cause of display discrepancy
- [ ] Fix data display in User Management table
- [ ] Test fix and verify table shows correct names/emails

## 🧭 SCOUT (Required)
_Investigation, findings, and risk notes.  
Document what was discovered, suspected causes, and open questions._  
**Last updated:** 2025-01-06 14:30

- **Initial Observation:** Table displays "Unnamed User" and "No email" while edit form shows correct data
- **Suspected Cause:** Possible API endpoint difference or data mapping issue between table fetch and edit fetch
- **Data Points:** 
  - Firebase ID: NkZKrURW5YXKd8DIHFwlHpR49ty2 shows correct name in edit
  - Firebase ID: RAwXfWmN shows "Unnamed User" in table
- **Question:** Are table and edit form using different API endpoints or data structures?

## 🛠️ BUILDER / PATCH / TINKER (Required)
_Fix details, implementation notes, and blockers.  
This section may be labeled as **BUILDER**, **PATCH**, or **TINKER**—use whichever role is appropriate.  
Document what was changed, how, and any technical notes._  
**Last updated:** 2025-01-06 14:30

- Pending investigation and fix implementation

---

## Investigation
- **Initial Trace:** User Management table displaying "Unnamed User"/"No email" while edit form shows correct data
- **Suspected Cause:** Data fetching inconsistency between table view and edit form
- **Files to Inspect:** 
  - UserTable component
  - EditUserDialog component  
  - Users API endpoints
  - User data mapping/transformation logic

## Fix (if known or applied)
- **Status:** ⏳ Pending
- **Fix Description:** To be determined after investigation
- **Testing:** Manual verification of table display showing correct names and emails

## Resolution Log
- **Commit/Branch:** `issue/1034-user-management-display-missing`
- **PR:** TBD
- **Deployed To:** TBD
- **Verified By:** TBD

---

> Store under: `/public/IFE-Tracking/Issues/current/Issue_1034_UserManagementDisplayMissing.md` and move to `/public/IFE-Tracking/Issues/completed/` when resolved. 

# SNR after interactions
- SNR = Summarize, NextSteps, RequestRoles