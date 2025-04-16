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
```javascript
// Sample structure of the new unified context
export const GeoLocationContext = createContext({
  // User's actual geo coordinates
  userLocation: {
    latitude: null,
    longitude: null,
    accuracy: null,
    lastUpdated: null,
  },
  
  // Selected location in hierarchy
  selectedLocation: {
    country: { id: null, name: null },
    region: { id: null, name: null },
    division: { id: null, name: null },
    city: { id: null, name: null },
  },
  
  // Nearest detected location (based on coordinates)
  nearestLocation: {
    country: { id: null, name: null },
    region: { id: null, name: null },
    division: { id: null, name: null },
    city: { id: null, name: null },
    distance: null,
  },
  
  // All available location data
  locationData: {
    countries: [],
    regions: [],
    divisions: [],
    cities: [],
  },
  
  // Loading and error states
  status: {
    loading: false,
    error: null,
  },
  
  // Methods
  updateUserLocation: () => {},
  selectLocation: () => {},
  resetLocation: () => {},
  fetchLocationData: () => {},
});
```

### 1.2 Schema and Data Migration

**Goal:** Complete the migration to mastered location fields in all relevant models.

**Tasks:**
- [ ] Update events schema to make mastered fields required
- [ ] Write a migration script to populate missing mastered fields
- [ ] Add validation to ensure consistency between legacy and mastered fields
- [ ] Add indexes to improve query performance

**API Enhancement:**
```javascript
// New API endpoint to update event location fields
router.post('/events/updateLocations', async (req, res) => {
  try {
    const { eventId, masteredRegionName, masteredDivisionName, masteredCityName } = req.body;
    
    // Update the event
    const event = await Events.findByIdAndUpdate(eventId, {
      masteredRegionName,
      masteredDivisionName,
      masteredCityName,
      // Also update the legacy field for backward compatibility
      regionName: masteredRegionName
    }, { new: true });
    
    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 1.3 Improved Error Handling and Fallbacks

**Goal:** Make the geo-location system more resilient to failures.

**Tasks:**
- [ ] Implement multiple fallback strategies for geolocation
- [ ] Add better error messaging and recovery
- [ ] Improve loading states with skeleton UI
- [ ] Add retry mechanisms for failed location fetches

**Implementation Example:**
```javascript
// Enhanced geolocation with multiple sources
const getUserLocation = async () => {
  try {
    // Try browser geolocation first (most accurate)
    const browserPosition = await getBrowserGeolocation();
    if (browserPosition) return browserPosition;
    
    // Fall back to IP-based geolocation
    const ipLocation = await getIPGeolocation();
    if (ipLocation) return ipLocation;
    
    // If that fails, try to use the user's last known location
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) return JSON.parse(savedLocation);
    
    // Final fallback to a default location
    return DEFAULT_LOCATION;
  } catch (error) {
    console.error('Geolocation failed:', error);
    return DEFAULT_LOCATION;
  }
};
```

## Phase 2: User Experience Enhancements (Sprint 3-4)

### 2.1 Location Context UI

**Goal:** Make the current location context clear and accessible throughout the app.

**Tasks:**
- [ ] Add a location breadcrumb component in the header
- [ ] Create a location selector dropdown for quick changes
- [ ] Add visual indicators for the current region/city
- [ ] Implement a "My Location" button to quickly return to user's location

**UI Component:**
```jsx
// Location breadcrumb component
const LocationBreadcrumb = () => {
  const { selectedLocation } = useGeoLocation();
  const { country, region, division, city } = selectedLocation;
  
  return (
    <Breadcrumbs aria-label="location breadcrumb">
      <Link href="#" onClick={() => selectCountry(country.id)}>
        {country.name || 'All Countries'}
      </Link>
      <Link href="#" onClick={() => selectRegion(region.id)}>
        {region.name || 'All Regions'}
      </Link>
      <Link href="#" onClick={() => selectDivision(division.id)}>
        {division.name || 'All Divisions'}
      </Link>
      <Typography color="textPrimary">
        {city.name || 'All Cities'}
      </Typography>
    </Breadcrumbs>
  );
};
```

### 2.2 Distance-Based Search

**Goal:** Allow users to find events based on distance from a location.

**Tasks:**
- [ ] Add UI controls for radius selection
- [ ] Create a backend endpoint for distance-based event search
- [ ] Implement location pinning for custom location searches
- [ ] Show distance information in event listings

**API Endpoint:**
```javascript
// Distance-based event search
router.get('/events/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 50000, startDate, endDate } = req.query;
    
    const events = await Events.find({
      venueGeolocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(radius)
        }
      },
      startDate: { $gte: new Date(startDate) },
      endDate: { $lte: new Date(endDate) },
      isActive: true
    }).sort({ startDate: 1 });
    
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2.3 Regional Organizer UI

**Goal:** Improve the experience for Regional Organizers creating events.

**Tasks:**
- [ ] Add a "My Regions" dashboard section
- [ ] Create visual indicators for authorized regions
- [ ] Implement validation to prevent creating events in unauthorized regions
- [ ] Add quick filters for an organizer's permitted venues

**Component Example:**
```jsx
// My Regions component for Regional Organizers
const MyRegionsPanel = () => {
  const { userPermissions } = useGeoLocation();
  const { allowedRegions } = userPermissions;
  
  return (
    <Card>
      <CardHeader title="My Regions" />
      <CardContent>
        <List>
          {allowedRegions.map(region => (
            <ListItem key={region.id} button onClick={() => selectRegion(region.id)}>
              <ListItemIcon>
                <LocationOnIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={region.name} 
                secondary={`${region.eventCount} events`} 
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};
```

## Phase 3: Advanced Features (Sprint 5-6)

### 3.1 Favorites System

**Goal:** Allow users to save and quickly access their favorite locations.

**Tasks:**
- [ ] Create a favorites data model and API endpoints
- [ ] Implement UI for adding/removing favorites
- [ ] Add a favorites quick-access menu
- [ ] Implement synchronization for logged-in users

**Data Model:**
```javascript
const userFavoritesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLogin',
    required: true
  },
  appId: { type: String, required: true, default: "1" },
  favorites: [{
    type: {
      type: String,
      enum: ['region', 'division', 'city'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
});
```

### 3.2 Map Integration

**Goal:** Add map-based navigation and visualization.

**Tasks:**
- [ ] Implement an interactive map component
- [ ] Show events and venues on the map
- [ ] Allow region/city selection via map
- [ ] Add map-based filtering and search

**Component:**
```jsx
// Map-based location selector
const LocationMap = () => {
  const { cities, selectLocation } = useGeoLocation();
  
  return (
    <Box height="400px" width="100%">
      <MapContainer center={[39.8283, -98.5795]} zoom={4}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {cities.map(city => (
          <Marker 
            key={city._id}
            position={[city.latitude, city.longitude]}
            eventHandlers={{
              click: () => selectLocation({
                city: { id: city._id, name: city.cityName }
              })
            }}
          >
            <Popup>{city.cityName}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};
```

### 3.3 Enhanced Permissions System

**Goal:** Create a comprehensive location-based permissions system.

**Tasks:**
- [ ] Implement a user-region-permission model
- [ ] Create a permission management UI for admins
- [ ] Add validation middleware for location-based actions
- [ ] Implement role-specific location views

**Permission Model:**
```javascript
const locationPermissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLogin',
    required: true
  },
  appId: { type: String, required: true },
  locationType: {
    type: String,
    enum: ['global', 'country', 'region', 'division', 'city'],
    required: true
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  permissions: {
    canViewEvents: { type: Boolean, default: true },
    canCreateEvents: { type: Boolean, default: false },
    canEditEvents: { type: Boolean, default: false },
    canDeleteEvents: { type: Boolean, default: false },
    canManageVenues: { type: Boolean, default: false },
    canManageOrganizers: { type: Boolean, default: false }
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLogin'
  },
  grantedAt: {
    type: Date,
    default: Date.now
  }
});
```

## Phase 4: Performance and Optimization (Sprint 7)

### 4.1 Data Caching

**Goal:** Improve performance through strategic caching.

**Tasks:**
- [ ] Implement client-side caching for location data
- [ ] Add server-side caching for frequently accessed queries
- [ ] Optimize data loading with selective updates
- [ ] Add background prefetching for likely user actions

**Implementation:**
```javascript
// Location data cache
const createLocationCache = () => {
  const cache = {
    data: {},
    timestamp: {},
    TTL: 3600000, // 1 hour
    
    get(key) {
      const item = this.data[key];
      const timestamp = this.timestamp[key];
      
      if (!item || !timestamp) return null;
      if (Date.now() - timestamp > this.TTL) {
        this.delete(key);
        return null;
      }
      
      return item;
    },
    
    set(key, value) {
      this.data[key] = value;
      this.timestamp[key] = Date.now();
    },
    
    delete(key) {
      delete this.data[key];
      delete this.timestamp[key];
    },
    
    clear() {
      this.data = {};
      this.timestamp = {};
    }
  };
  
  return cache;
};
```

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