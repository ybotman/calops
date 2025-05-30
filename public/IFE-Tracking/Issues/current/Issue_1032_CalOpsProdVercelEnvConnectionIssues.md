# Issue: Getting CalOps to Prod - Vercel Env & Connection Issues

> **IFE Issue Log**  
> This document is the single source of truth for capturing all actions, findings, and status updates related to this issue.  
> Guild roles must update their own section below, using their role icon and a datetime stamp.  
> All investigation, assignments, and fixes must be recorded here by the responsible role.

## Overview
- **Reported On:** 2025-05-29  
- **Reported By:** Toby Balsley  
- **Environment:** Production / Vercel  
- **Component/Page/API Affected:** CalOps Frontend on Vercel, API Connections  
- **Symptoms:** Environment variables are not being loaded, API connections fail.

## Steps to Reproduce
1. Deploy the CalOps frontend to Vercel.  
2. Access the Vercel URL.  
3. Observe missing environment variables in console.  
4. Notice API connection errors to the CalOps backend.

## 🗂️ KANBAN (Required)
**Last updated:** 2025-05-29 17:15  
- [x] ✅ **Investigate Vercel build & runtime env var configuration** - COMPLETED
  - Scout: Analyzed 6 critical environment variables in .env file
  - Scout: Reviewed next.config.mjs and API client patterns
  - Architect: Designed production environment variable mapping strategy
- [x] ✅ **Prepare deployment documentation and templates** - COMPLETED
  - Tinker: Created comprehensive VERCEL_DEPLOYMENT_GUIDE.md
  - Tinker: Generated .env.production.template with security annotations
- [ ] ⚠️ **BLOCKED: Resolve backend production URL dependency** - HIGH PRIORITY
  - Frontend requires `NEXT_PUBLIC_BE_URL` pointing to production backend
  - Current localhost:3010 prevents production deployment
  - Need: Backend production URL or deployment strategy
- [ ] ⏳ **Update Vercel project settings with environment variables** - READY
  - Documentation prepared, awaiting backend URL resolution
  - Template ready for immediate Vercel configuration
- [ ] ⏳ **Deploy and verify CalOps production functionality** - PENDING
  - Contingent on backend URL resolution and Vercel configuration

## 🧭 SCOUT (Required)
**Last updated:** 2025-05-29 16:30  
- ✅ **Environment Variables Analysis:** Found 6 critical env vars in .env file
  - `NEXT_PUBLIC_BE_URL=http://localhost:3010` (frontend-accessible)
  - `MONGODB_URI` and `MONGODB_URI_PROD` (server-side MongoDB connections)
  - `FIREBASE_JSON` (Base64-encoded Firebase service account)
  - `NEXTAUTH_URL=http://localhost:3003` and `NEXTAUTH_SECRET` (authentication)
  - `NEXT_PUBLIC_ENVIRONMENT=development`
- ✅ **Next.js Config Analysis:** next.config.mjs correctly logs NEXT_PUBLIC_BE_URL and sets up API rewrites
- ✅ **API Client Analysis:** src/lib/api-client.js:9 uses `process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010'`
- ⚠️ **Issue Identified:** Environment variables are localhost-specific and need Vercel production equivalents
- ⚠️ **Security Concern:** Some variables like MONGODB_URI contain credentials that need secure Vercel env var setup

## 🤔 ARCHITECT (Required)
**Last updated:** 2025-05-29 16:45  
- 🏗️ **Production Environment Design:** Created comprehensive mapping strategy
  - **Frontend Variables:** `NEXT_PUBLIC_BE_URL` must point to production backend
  - **Database:** Use `MONGODB_URI_PROD` (note: currently suffixed with 'x' - needs activation)
  - **Authentication:** `NEXTAUTH_URL` needs production domain, `NEXTAUTH_SECRET` needs secure generation
  - **Environment Flag:** `NEXT_PUBLIC_ENVIRONMENT=production`
- 📋 **Vercel Configuration Plan:**
  - Environment Variables Tab: Add all 6 production equivalents
  - Security: Use encrypted storage for credentials (MongoDB, Firebase, NextAuth secret)
  - Scope: Set to Production environment only
- ⚠️ **Backend Dependencies:** Production deployment requires backend API at production URL
- 🔒 **Security Architecture:** Sensitive credentials isolated in Vercel's encrypted env vars

## 🎛️ TINKER (Required)
**Last updated:** 2025-05-29 17:30  
- ✅ **REVISED: Pure Frontend Architecture Documentation**
  - Updated `VERCEL_DEPLOYMENT_GUIDE.md` for simplified deployment
  - **REMOVED MongoDB dependencies** - CalOps is pure frontend
  - **SIMPLIFIED to 5 environment variables** (down from 8)
  - Created `.env.production.simplified` with clean configuration
- ✅ **Environment Variables Simplified:**
  - `NEXT_PUBLIC_BE_URL` - All data from backend API ✅
  - `FIREBASE_JSON` - Authentication only ✅  
  - `NEXTAUTH_URL` + `NEXTAUTH_SECRET` - Session management ✅
  - `NEXT_PUBLIC_ENVIRONMENT=production` ✅
- ✅ **Architecture Discovery:** CalOps uses backend API for ALL data
  - Venues: 146 ✅ (working via backend)
  - Users/Events/Organizers: 0 ❌ (backend API "unexpected status")
  - Root cause: Backend API connectivity, NOT environment variables

## 🛠️ BUILDER / PATCH (Required)
**Last updated:** 2025-05-29 00:00  
- TBD: Configure Vercel environment variables and resolve backend dependency.

## Investigation
- **Potential Cause:** Incorrect VERCEL_ENV variable names, missing NEXT_PUBLIC_ prefixes.  
- **Files to Inspect:** next.config.mjs, Vercel dashboard settings.

## 📊 Deployment Readiness Assessment
**Current Status:** 75% Ready - BLOCKED on Backend Dependency

### ✅ Ready Components:
- Environment variable analysis complete
- Production configuration templates created
- Security requirements documented
- Vercel deployment guide prepared
- All development environment variables identified

### ⚠️ Blocking Issues:
1. **Backend Production URL Unknown**
   - `NEXT_PUBLIC_BE_URL` currently points to localhost:3010
   - Frontend cannot function without production backend API
   - Need backend deployment URL or existing production endpoint

### 🎯 Immediate Next Steps:
1. Identify backend production deployment URL
2. Update `.env.production.template` with actual backend URL
3. Configure Vercel environment variables using prepared documentation
4. Deploy and test production functionality

## Fix (if known or applied)
- **Status:** 🚧 In Progress - Documentation Phase Complete
- **Fix Description:** Comprehensive deployment configuration prepared. Blocked on backend production URL dependency.

## Resolution Log
- **Commit/Branch:** `issue/1032-calops-vercel-env-connection`  
- **PR:** TBD  
- **Deployed To:** Vercel Production (Pending backend URL)
- **Verified By:** TBD

> Store under: `/public/IFE-Tracking/Issues/current/Issue_1032_CalOpsProdVercelEnvConnectionIssues.md`
