# Feature 3014: Organizer UI Tweaks

## KANBAN

**Feature ID**: 3014
**Type**: Feature
**Status**: ✅ Completed
**Priority**: High
**Created**: 2025-01-06
**Completed**: 2025-01-06
**Target Branch**: `feature/3014-organizer-ui-tweaks`

## SCOUT

### Purpose
Enhance the Organizers page UI for better usability and information density by:
- Using icons for boolean columns to save space
- Showing connected user names instead of just Y/N
- Improving column widths and headers
- Replacing tabs with filter dropdowns
- Adding location-based filtering

### User Story
As an admin, I want a more compact and informative organizers table that shows:
- Visual indicators (icons) for approval/authorization status
- Active status as colored icon next to name
- Connected user's actual name instead of Y/N
- Better filtering options including location-based filters

### Requirements
1. **Column Changes**:
   - Approved/Authorized: Use green checkmark/red X icons, header "Appr/Auth"
   - Remove Status column, add active indicator after name
   - Name column: 30 chars, shortName: 15 chars
   - userConnected: Show Firebase user's display name
   - Actions: Keep Edit, Link, Delete buttons

2. **Tab Replacement**:
   - Remove Active/Inactive tabs
   - Add filters: "Not Approved" and "Not Authorized"
   - Keep same columns and actions across all views

3. **Location Filtering**:
   - Add dropdown filter for masteredCityId (show city names)
   - Add dropdown filter for masteredDivisionId (show division names)
   - Fetch location names from backend for display

## ARCHITECT

### Technical Design

#### Column Configuration
```javascript
const columns = [
  {
    field: 'name',
    headerName: 'Name',
    width: 250, // For 30 chars
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <span>{params.value}</span>
        {params.row.active ? 
          <FiberManualRecordIcon sx={{ fontSize: 12, color: 'success.main' }} /> :
          <FiberManualRecordIcon sx={{ fontSize: 12, color: 'grey.400' }} />
        }
      </Box>
    )
  },
  {
    field: 'shortName',
    headerName: 'Short Name',
    width: 150 // For 15 chars
  },
  {
    field: 'isApproved',
    headerName: 'Appr',
    width: 60,
    align: 'center',
    renderCell: (params) => 
      params.value ? 
        <CheckCircleIcon sx={{ color: 'success.main' }} /> : 
        <CancelIcon sx={{ color: 'error.main' }} />
  },
  {
    field: 'isAuthorized',
    headerName: 'Auth',
    width: 60,
    align: 'center',
    renderCell: (params) => 
      params.value ? 
        <CheckCircleIcon sx={{ color: 'success.main' }} /> : 
        <CancelIcon sx={{ color: 'error.main' }} />
  },
  {
    field: 'userConnected',
    headerName: 'Connected User',
    width: 200,
    renderCell: (params) => {
      // Will need to lookup Firebase user name
      return params.row.linkedUser?.displayName || '-';
    }
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    renderCell: (params) => (
      <>
        <IconButton onClick={() => handleEdit(params.row)}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => handleLink(params.row)}>
          <LinkIcon />
        </IconButton>
        <IconButton onClick={() => handleDelete(params.row)}>
          <DeleteIcon />
        </IconButton>
      </>
    )
  }
];
```

#### Filter Implementation
```javascript
// Replace tabs with filter checkboxes
const filters = {
  notApproved: false,
  notAuthorized: false,
  masteredCityId: null,
  masteredDivisionId: null
};

// Location filter dropdowns
<FormControl>
  <InputLabel>City</InputLabel>
  <Select value={filters.masteredCityId} onChange={handleCityFilter}>
    <MenuItem value="">All Cities</MenuItem>
    {cities.map(city => (
      <MenuItem key={city.id} value={city.id}>{city.name}</MenuItem>
    ))}
  </Select>
</FormControl>
```

## BUILDER

### Implementation Plan

#### Phase 1: Column Updates
1. Update column definitions with new widths and renderers
2. Add icon imports (CheckCircleIcon, CancelIcon, FiberManualRecordIcon)
3. Implement active status indicator in name column
4. Update headers for Approved/Authorized columns

#### Phase 2: User Connection Display
1. Fetch linked user details from Firebase
2. Display user's displayName in userConnected column
3. Handle cases where no user is connected

#### Phase 3: Filter Implementation
1. Remove tab navigation component
2. Add filter state for notApproved/notAuthorized
3. Implement filter UI with checkboxes
4. Update data fetching to respect filters

#### Phase 4: Location Filtering
1. Fetch mastered locations (cities and divisions) from backend
2. Create dropdown filter components
3. Add location filter to API calls
4. Display location names in dropdowns

### API Requirements
- GET /api/mastered-locations/cities - Fetch all cities
- GET /api/mastered-locations/divisions - Fetch all divisions
- GET /api/organizers?masteredCityId=X&masteredDivisionId=Y - Filter by location

## Success Criteria
- [ ] Approved/Authorized columns show icons with compact headers
- [ ] Active status shows as colored dot next to name
- [ ] Name column properly truncated at 30 chars
- [ ] Short name column properly truncated at 15 chars
- [ ] Connected user shows Firebase display name
- [ ] Active/Inactive tabs replaced with filter checkboxes
- [ ] Location filter dropdowns functional
- [ ] All existing functionality preserved

## Technical Notes
- Icons should be from MUI Icons package
- Use consistent green (#4caf50) for positive states
- Use consistent red (#f44336) for negative states
- Grey (#9e9e9e) for inactive states
- Ensure responsive behavior on smaller screens

## Status Updates
- ✅ Feature document created
- 🚧 Implementation in progress
- ⏳ Testing pending
- ⏳ Deployment pending