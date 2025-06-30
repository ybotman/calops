# CALOPS-24 Venue Filtering Enhancements - Integration Plan

## Current Branch Analysis

### CALOPS-24 Branch Status
**Branch:** `task/CALOPS-24/venue-filtering-enhancements`
**Commits ahead of DEVL:** 3
1. `6deba8d` - Implement VenueEditDialog with full functionality
2. `458afa7` - Add JIRA ticket documentation
3. `f472fa9` - Update venue management UI with filtering enhancements

### Key Differences Between Branches

| Component | DEVL | CALOPS-24 | TEST (remote) |
|-----------|------|-----------|---------------|
| VenueEditDialog | ❌ Missing | ✅ Implemented | ✅ Has different version |
| Division/City Filtering | ✅ Present | ✅ Enhanced | ✅ Present |
| Approved/Not Approved Tabs | ✅ Present | ✅ Present | ✅ Present |
| fetchNearestCities | ❌ Missing | ✅ Implemented | ✅ Present |
| fetchGeoHierarchy | ❌ Missing | ✅ Implemented | ✅ Present |
| Import from BTC | ❌ Missing | ❌ Missing | ✅ Present |

## Integration Steps

### 1. Merge CALOPS-24 → DEVL
```bash
git checkout DEVL
git merge task/CALOPS-24/venue-filtering-enhancements
```

**Expected Changes:**
- Add `VenueEditDialog` component
- Update `VenuesPage.js` to include dialog and new props
- Update `VenuesPageContainer.js` with `fetchNearestCities` and `fetchGeoHierarchy`
- Update `useVenues.js` to use API client instead of direct axios calls
- Fix API client parameter naming (longitude/latitude vs lng/lat)

### 2. Test in DEVL
- Verify venue editing works
- Test geo hierarchy selection in edit dialog
- Confirm isActive/isApproved toggles function
- Validate nearest city lookup

### 3. Promote DEVL → TEST
```bash
git checkout TEST
git merge DEVL
```

**Considerations:**
- TEST has inline implementation vs DEVL's component architecture
- May need to reconcile architectural differences
- TEST includes BTC import functionality not in DEVL

### 4. Resolve TEST Deployment Issues
**Required Vercel Environment Variables:**
```
NEXT_PUBLIC_FIREBASE_JSON=<base64 encoded config>
NEXT_PUBLIC_BE_URL=<backend API URL for TEST>
```

## Risk Assessment

### Low Risk
- VenueEditDialog is self-contained component
- Filtering enhancements are additive
- API client updates are isolated

### Medium Risk
- Architecture differences between TEST (inline) and DEVL (component-based)
- API parameter naming inconsistencies (lng/lat vs longitude/latitude)

### High Risk
- None identified

## Testing Checklist

- [ ] Venue edit dialog opens correctly
- [ ] All venue fields are editable
- [ ] isActive/isApproved toggles work
- [ ] Geo hierarchy selection works (manual mode)
- [ ] Nearest city lookup works
- [ ] Save/update venue persists changes
- [ ] Division/city filtering still works
- [ ] Approved/Not Approved tabs still work

## Rollback Plan
If issues arise:
```bash
git checkout DEVL
git reset --hard origin/DEVL
```

## Next Steps After Integration

1. Consider adding BTC import functionality from TEST branch
2. Standardize API parameter naming across codebase
3. Document venue management features in user guide
4. Create unit tests for VenueEditDialog component

## Notes
- CALOPS-24 is fully complete with all acceptance criteria met
- The branch is ready for integration
- No conflicts expected with current DEVL state