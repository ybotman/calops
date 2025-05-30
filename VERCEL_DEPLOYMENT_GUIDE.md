# Vercel Deployment Guide for CalOps (Pure Frontend)

## Architecture Overview
CalOps is a **pure frontend application** that connects to a backend API for all data operations. It does NOT require MongoDB - all data comes from the backend API via `NEXT_PUBLIC_BE_URL`.

## Environment Variables Configuration

### Required Vercel Environment Variables (5 Total)

Add these environment variables in your Vercel project dashboard (Settings > Environment Variables):

#### 1. Application Configuration
```
NEXT_PUBLIC_ENVIRONMENT=production
```

#### 2. API Backend URL (CRITICAL)
```
NEXT_PUBLIC_BE_URL=https://[YOUR-BACKEND-PRODUCTION-URL]
```
**⚠️ CRITICAL:** All data (users, events, organizers, venues) comes from this backend API

#### 4. Firebase Service Account (Base64 Encoded)
```
FIREBASE_JSON=ewogICAgInR5cGUiOiAic2VydmljZV9hY2NvdW50IiwKICAgICJwcm9qZWN0X2lkIjogInRhbmdvdGllbXBvLTI1N2ZmIiwKICAgICJwcml2YXRlX2tleV9pZCI6ICI5MGJhNjZlNTA5YmIxODBjMTk2NGFhMjhlMTAxNGFjMWVjM2QzZDdmIiwKICAgICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQ212bTdXWWhxNUs4K2NcbnBLTWtEdENCTWJsNEdCZGE2bmNtVmlpeldadkFGekxUSGo4WEx6TUZvNCtoLzN6aDJ1RjlOcTJyMzN2dnl4R3BcblBmV2FJSGlHaEw4RVdwU2hrbTdDUkE4Um1PN3Nvd256OVZFblczOEdWRlRMQTdYL3h3NDM5aCtXQy9aL1RSN05cblIyUEJOa2YxMnNOeFdZeVA4eVIwSWFjS0htRk5zMGFWbWJEaWNWZ0NCQ2cyUUttVzJqR0t0alhNcWlZa1pudmFcbmFZQnNNWjFZMjZJN04xeXdzNmxRZ3Z1cGliaWdtUTBucHpnbENjMEFtOG1Qd2dSbzViSkY5WU5XenY2NjhVb2ZcbjFvWGkvSFUyNkpwelQ3NFNpOWNiZzlqbC9KMXowOHh2bmdncUF2MEFoSVVVRUhoTy9tRmwwb01PbXkxMWQzSlNcbnJXamt1L3JWQWdNQkFBRUNnZ0VBSzcrdFB3eHdiSU1sTHJrM29KOU9iNGRIWFU0YzJwckg5a1FHMjcrNEVMZEZcbmU0VGxFc1VzZ3Q4K01VZmlVVFBuazczRDVXTjJsaHpXbm13R1E1RWZibFBuOWxGNXk4YXF6c2VpbUlCaXQ2MnpcblQ5SGVvQS91alErVlM4ckdkcnlZYTNCbEt5NHFWNDQ1ZGF5MGJKNDhWVEkzczBiR2pZSkMzMEZ4SFVPSlRpUStcbkEvR2FsSy9SdHM4YzN4K0V0b2FFNTNSelhjbFk0YXZsSFA2VTFQV25zOGMwcCs5djZNcmlTdExVUU92MXhHTDdcbkRWSnc5c21XNkR2VmZJa240YWR5UVhTT09OYldLK0ZSN09PaUFIMEtNNDQ1amtkbml0VnJEa3g1eHJIR1NGdnlcbkU0K3NCdEhESWEzb2hOM0R4MnVTRklWNk11S215RUljTTN6SHZmVm5KUUtCZ1FEUnRkRHplVUJSa25NN1dWS0tcbnNTQm5KZW1jKzNqQW5RU08rVkhZSkNoU3pZVHNDRUJjU0VpcEZRVzUvblZPSzV4RHk0bk1PdTVjMVY4VGpBcHBcbnlkc0plckN6b2VZcUVjMWR1Q3ViblBVbGxPTkQ1ZE1BVWdncFBDWnNhbE5hcnVsWUZobTdERHhMWWZBTk1LREFcbndkSTZ0MTJRVXlxUnRIb0VZbFZIQVMyUGJ3S0JnUURMakxNWmlLaXNwc25ZMWNjdzNkaTA2U0pBSS9IclBQWGlcbnpUeCtNeUJRS2wvTlJnRlo0YkwzN2VCR21aVkd5NEZ5aXdqaS9GWTRnVThPcHdlUHZhMG1HN0prWnhMclI2VmtcbmtETVJaY1R1RERuUkdvVzRxL0NPb0hDc1FzdW5EWmlNZ1dRSHMyOFg0UDYwMjd3c0l4TTB4M0lRWmc4a0xLV2tcbmhrQ1hTUGkzK3dLQmdRQ1oxWUQ1Q2FvWDdKRmhLTzMyMVdaS3BESVJ1UnJrV0lwK2d2LzV5TlJYb1hGdlg4SXVcbnI4dTFWTG1GcmRiSlNBNXlZUDJ0ZGxGaWdoY2psS2dTNEVNd1dmTURZckVmalQyVUVVVFQremlOb0FGeXprV1JcblI1dTYrK2ZId2R0eGV6dXJKVk1zdGhZSXlrZzR0TUpIaENhK2NjSk4yK1F2VEMveHhWeC9JS3NXT3dLQmdBRCtcbmJ1RnhDV0hPYnEzZ1hWaWZ2SzhsZEVWYjU1SitlYlRoeTZuU0ZoWk9IcW1oN2QvQ2VsMDdqQnpNSXk1MVQreC9cblFVdmFiNUZYRUV2Q0JRZHVwYW5KK05VRXE5TDZScFIzSDhpMTlvQXpEeFUyUy9EYTVoSE1Oc0Nna3QzOTh3Qzhcbm9RQm9uK0k5OXdCckVrQWs2N01XUmpoT1IwU2w4eWthZnJZK1pQaUJBb0dBZSszc3M1VWh4Ym05TXBqeEQ0dmpcbjhNNHNpMmFreG1rKzg4YnZhTitFT0JGUGhRZXRTYS9WWFE0eGFwWER6b3gxNWg4SmlFYXNsL0ZVZUxvbXZKODhcblNvWWtqK25iSHhTOWhyeW5iUWxVV25HdzA1dEFDTEloWEtBdmxWS3NKbTNNelRJY0IxZDBJc3YwUHFURzdaMDZcbktsUWNxQ0x5elV1ZE9ZT0lMU3NISDEwPVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAgICJjbGllbnRfZW1haWwiOiAiZmlyZWJhc2UtYWRtaW5zZGstZ3gzcmxAdGFuZ290aWVtcG8tMjU3ZmYuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICAgImNsaWVudF9pZCI6ICIxMTExNzkxNDk5MjAxMTgzNTYyNzAiLAogICAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAgICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZmlyZWJhc2UtYWRtaW5zZGstZ3gzcmwlNDB0YW5nb3RpZW1wby0yNTdmZi5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIgogIH0KICAg
```
**🔒 SECURITY:** Mark as "Encrypted" - contains Firebase private keys

#### 5. NextAuth Configuration
```
NEXTAUTH_URL=https://[YOUR-VERCEL-APP-URL]
NEXTAUTH_SECRET=[GENERATE-SECURE-SECRET]
```
**🔒 SECURITY:** Generate a new secure secret for production using:
```bash
openssl rand -base64 32
```

## Deployment Steps

### Step 1: Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your CalOps repository

### Step 2: Configure Environment Variables
1. In project settings, go to "Environment Variables"
2. Add all variables listed above
3. Set Environment scope to "Production"
4. Mark sensitive variables as "Encrypted"

### Step 3: Build Configuration
Vercel should auto-detect Next.js. Verify these settings:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

### Step 4: Deploy
1. Click "Deploy"
2. Monitor build logs for environment variable loading
3. Check for successful deployment

## Critical Dependencies

### Backend API Requirement
⚠️ **BLOCKING ISSUE:** CalOps frontend requires a deployed backend API.

Current configuration points to `http://localhost:3010`. You need:
1. Deploy the backend API to a production environment
2. Update `NEXT_PUBLIC_BE_URL` with the production backend URL

### Database Access
- MongoDB cluster appears to be shared between development and production databases
- `TangoTiempo` database for development
- `TangoTiempoProd` database for production
- Ensure production database is properly set up

## Troubleshooting

### Common Issues
1. **Environment variables not loading:** Check NEXT_PUBLIC_ prefix for client-side variables
2. **API connection failures:** Verify backend URL and CORS settings
3. **Build failures:** Check for missing dependencies or build errors
4. **Authentication issues:** Verify NEXTAUTH_URL matches deployed domain

### Debug Steps
1. Check Vercel function logs for runtime errors
2. Verify environment variables are properly set in Vercel dashboard
3. Test API endpoints individually
4. Check browser console for client-side errors

## Security Checklist

- [ ] All sensitive environment variables marked as "Encrypted"
- [ ] Production-specific NEXTAUTH_SECRET generated
- [ ] Database credentials secured
- [ ] Firebase service account properly configured
- [ ] NEXTAUTH_URL matches production domain
- [ ] Backend CORS configured for production domain

## Post-Deployment Verification

1. Visit deployed Vercel URL
2. Check browser console for environment variable loading
3. Test API connections
4. Verify authentication flow
5. Test core application functionality

---

**Created for Issue #1032 - CalOps Prod Vercel Environment & Connection Issues**