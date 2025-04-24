# Geo-Location System Roadmap

This document outlines the proposed roadmap for enhancing the geo-location capabilities in the TangoTiempo application. It prioritizes improvements based on user impact and technical feasibility.

## Phase 1: Foundation Improvements (Sprint 1-2)

### 1.1 Unified Location Context

**Goal:** Combine the `RegionsContext` and `MasteredLocationContext` into a single source of truth.

**Tasks:**
- [x] Create a new `GeoLocationContext` that incorporates all functionality
- [x] Add IP-based geolocation with caching
- [x] Enable server-side rendering compatibility
- [x] Create LocationInfo component for header
- [ ] Migrate components to use the new context
- [ ] Deprecate old contexts with warnings
- [ ] Add state persistence for location selections (localStorage)

**Current Status:**
- GeoLocationContext created and working parallel to existing contexts
- LocationContextModal integrated with GeoLocationContext
- LocationInfo component displays geo hierarchy in header (BUGFIX NEEDED)
- Event filtering connected to GeoLocationContext (useCalendarPage updated)
- Fixed sessionStorage handling to work with SSR

**Technical Details:**
// Sample structure of the new 

### 4.2 Analytics and Usage Tracking

**Goal:** Gather data on how users interact with location features.

**Tasks:**
- [ ] Implement analytics for location selections
- [ ] Track popular regions and cities
- [ ] Measure impact of location features on engagement
- [ ] Create a location analytics dashboard

**Tracking Example:**
```javascript
// Location selection tracking
const trackLocationSelection = (locationType, locationId, locationName) => {
  // Log to analytics
  analytics.track('location_selected', {
    location_type: locationType,
    location_id: locationId,
    location_name: locationName,
    user_id: currentUser?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  // Also track locally for quick stats
  const selections = JSON.parse(localStorage.getItem('locationSelections') || '{}');
  selections[locationId] = {
    count: (selections[locationId]?.count || 0) + 1,
    lastSelected: new Date().toISOString(),
    name: locationName,
    type: locationType
  };
  localStorage.setItem('locationSelections', JSON.stringify(selections));
};
```

### 4.3 Final Cleanup and Documentation

**Goal:** Ensure the geo-location system is well-documented and maintainable.

**Tasks:**
- [ ] Remove all deprecated code and contexts
- [ ] Update API documentation
- [ ] Create comprehensive usage guides
- [ ] Verify cross-browser and mobile compatibility

## Timeline

| Phase | Features | Estimated Completion |
|-------|----------|----------------------|
| 1.1   | Unified Location Context | Week 2 |
| 1.2   | Schema and Data Migration | Week 3 |
| 1.3   | Improved Error Handling | Week 4 |
| 2.1   | Location Context UI | Week 6 |
| 2.2   | Distance-Based Search | Week 8 |
| 2.3   | Regional Organizer UI | Week 10 |
| 3.1   | Favorites System | Week 12 |
| 3.2   | Map Integration | Week 14 |
| 3.3   | Enhanced Permissions | Week 16 |
| 4.1   | Data Caching | Week 17 |
| 4.2   | Analytics | Week 18 |
| 4.3   | Final Cleanup | Week 20 |

## Success Metrics

- **User Engagement**: Increase in events viewed per session
- **Creation Efficiency**: Reduced time for Regional Organizers to create events
- **Error Reduction**: Decrease in geolocation failures by 90%
- **Performance**: Location data loading times under 200ms
- **Adoption**: 80% of users selecting a specific region/city
- **Satisfaction**: Improved ratings in user surveys for location features