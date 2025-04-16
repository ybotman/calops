# TangoTiempo Geo-Location API Reference

## Overview

This document provides a comprehensive reference for the geo-location APIs available in the TangoTiempo system. These APIs support location-based event discovery, creation, and management.

## Backend API Endpoints

### Mastered Location Endpoints

#### GET /api/masteredLocations/nearestMastered

Finds the nearest city to a given set of coordinates.

**Query Parameters:**
- `latitude` (required): Latitude coordinate
- `longitude` (required): Longitude coordinate
- `maxDistance` (optional): Maximum distance in meters (default: none)
- `isActive` (optional): Filter by active status (default: true)
- `appId` (optional): Application ID (default: "1")

**Response:**
```json
{
  "cityID": "6751f58a5db435dd8005e479",
  "cityName": "Boston",
  "distance": 1234,
  "regionID": "6751f58a5db435dd8005e45b",
  "regionName": "Northeast",
  "divisionID": "6751f58a5db435dd8005e461",
  "divisionName": "New England",
  "countryID": "6751f57e2e74d97609e7dca0",
  "countryName": "United States",
  "latitude": 42.3601,
  "longitude": -71.0589
}
```

#### GET /api/masteredLocations/countries

Returns a list of countries.

**Query Parameters:**
- `isActive` (optional): Filter by active status
- `appId` (optional): Application ID (default: "1")

**Response:**
```json
[
  {
    "_id": "6751f57e2e74d97609e7dca0",
    "countryName": "United States",
    "countryCode": "US",
    "active": true,
    "appId": "1"
  }
]
```

#### GET /api/masteredLocations/regions

Returns regions for a specified country.

**Query Parameters:**
- `countryId` (required): MongoDB ID of the country
- `isActive` (optional): Filter by active status
- `appId` (optional): Application ID (default: "1")

**Response:**
```json
[
  {
    "_id": "6751f58a5db435dd8005e45b",
    "regionName": "Northeast",
    "regionCode": "NE",
    "active": true,
    "masteredCountryId": "6751f57e2e74d97609e7dca0",
    "appId": "1"
  }
]
```

#### GET /api/masteredLocations/divisions

Returns divisions for a specified region.

**Query Parameters:**
- `regionId` (required): MongoDB ID of the region
- `isActive` (optional): Filter by active status
- `appId` (optional): Application ID (default: "1")

**Response:**
```json
[
  {
    "_id": "6751f58a5db435dd8005e461",
    "divisionName": "New England",
    "divisionCode": "NE",
    "active": true,
    "masteredRegionId": "6751f58a5db435dd8005e45b",
    "states": ["MA", "NH", "VT", "ME", "RI", "CT"],
    "appId": "1"
  }
]
```

#### GET /api/masteredLocations/cities

Returns cities for a specified division.

**Query Parameters:**
- `divisionId` (optional): MongoDB ID of the division
- `isActive` (optional): Filter by active status
- `appId` (optional): Application ID (default: "1")

**Response:**
```json
[
  {
    "_id": "6751f58a5db435dd8005e479",
    "cityName": "Boston",
    "cityCode": "BOS",
    "isActive": true,
    "masteredDivisionId": "6751f58a5db435dd8005e461",
    "location": {
      "type": "Point",
      "coordinates": [-71.0589, 42.3601]
    },
    "latitude": 42.3601,
    "longitude": -71.0589,
    "appId": "1"
  }
]
```

### Event Location Endpoints

#### GET /api/events/byMasteredLocations

Retrieves events filtered by mastered location hierarchy.

**Query Parameters:**
- `masteredRegionName` (optional): Filter by region name
- `masteredDivisionName` (optional): Filter by division name
- `masteredCityName` (optional): Filter by city name
- `start` (optional): Start date for events
- `end` (optional): End date for events
- `active` (optional): Filter by active status (default: true)
- `appId` (optional): Application ID (default: "1")

**Response:**
```json
[
  {
    "_id": "6751f58a5db435dd8005e123",
    "title": "Tango Night",
    "description": "A night of Argentine tango dancing",
    "startDate": "2023-04-15T19:00:00Z",
    "endDate": "2023-04-15T23:00:00Z",
    "categoryFirst": "Milonga",
    "ownerOrganizerID": "6751f58a5db435dd8005e789",
    "ownerOrganizerName": "Boston Tango Society",
    "masteredRegionName": "Northeast",
    "masteredDivisionName": "New England",
    "masteredCityName": "Boston",
    "regionName": "Northeast",
    "cost": "$15",
    "isActive": true,
    "isFeatured": false,
    "isCanceled": false,
    "appId": "1"
  }
]
```

#### POST /api/events/post

Creates a new event with location data.

**Request Body:**
```json
{
  "title": "Tango Night",
  "description": "A night of Argentine tango dancing",
  "startDate": "2023-04-15T19:00:00Z",
  "endDate": "2023-04-15T23:00:00Z",
  "categoryFirst": "6751f58a5db435dd8005e321",
  "masteredRegionName": "Northeast",
  "masteredDivisionName": "New England",
  "masteredCityName": "Boston",
  "regionName": "Northeast",
  "ownerOrganizerID": "6751f58a5db435dd8005e789",
  "cost": "$15",
  "appId": "1"
}
```

**Response:**
```json
{
  "success": true,
  "event": {
    "_id": "6751f58a5db435dd8005e123",
    "title": "Tango Night",
    "description": "A night of Argentine tango dancing",
    "startDate": "2023-04-15T19:00:00Z",
    "endDate": "2023-04-15T23:00:00Z",
    "categoryFirst": "6751f58a5db435dd8005e321",
    "masteredRegionName": "Northeast",
    "masteredDivisionName": "New England",
    "masteredCityName": "Boston",
    "regionName": "Northeast",
    "ownerOrganizerID": "6751f58a5db435dd8005e789",
    "ownerOrganizerName": "Boston Tango Society",
    "cost": "$15",
    "isActive": true,
    "isFeatured": false,
    "isCanceled": false,
    "appId": "1"
  }
}
```

## Frontend Hooks and Utilities

### useGeoLocations

A hook for obtaining the user's geographical coordinates based on IP address.

**Usage:**
```javascript
const { latitude, longitude, loading, error, refetch } = useGeoLocations();
```

**Returns:**
- `latitude`: The user's latitude
- `longitude`: The user's longitude
- `loading`: Boolean indicating if geolocation is in progress
- `error`: Any error that occurred during geolocation
- `refetch`: Function to manually trigger geolocation refresh

### useMasteredLocations

A hook for working with the hierarchical location data.

**Usage:**
```javascript
const {
  countries,
  regions,
  divisions,
  cities,
  nearestCity,
  loading,
  error,
  fetchCountries,
  fetchRegions,
  fetchDivisions,
  fetchCities,
  fetchNearestMastered
} = useMasteredLocations();
```

**Methods:**
- `fetchCountries(isActive = true)`: Retrieves all countries
- `fetchRegions(countryId, isActive = true)`: Retrieves regions for a country
- `fetchDivisions(regionId, isActive = true)`: Retrieves divisions for a region
- `fetchCities(divisionId, isActive = true)`: Retrieves cities for a division
- `fetchNearestMastered({ latitude, longitude, maxDistance = 50000, isActive = true })`: Finds the nearest city to coordinates

### useMasteredLocation Context

A React context for accessing the user's nearest city information.

**Usage:**
```javascript
const { nearestCity, loading, error, fetchNearestCity } = useMasteredLocation();
```

**Properties:**
- `nearestCity`: The user's nearest city with full hierarchical information
- `loading`: Boolean indicating if the nearest city is being loaded
- `error`: Any error that occurred during the nearest city lookup
- `fetchNearestCity(latitude, longitude, maxDistance)`: Function to manually find the nearest city

### RegionsContext

A React context for managing the selected region, division, and city.

**Usage:**
```javascript
const {
  regions,
  selectedRegion,
  setSelectedRegion,
  selectedRegionID,
  setSelectedRegionID,
  selectedDivision,
  setSelectedDivision,
  selectedCity,
  setSelectedCity
} = useContext(RegionsContext);
```

**Properties:**
- `regions`: Array of all regions
- `selectedRegion`: Name of the currently selected region
- `selectedRegionID`: ID of the currently selected region
- `selectedDivision`: Name of the currently selected division
- `selectedCity`: Name of the currently selected city
- `setSelectedRegion`, `setSelectedRegionID`, `setSelectedDivision`, `setSelectedCity`: Functions to update selections

## Data Models

### MasteredCountry

```javascript
{
  appId: String,
  countryName: String,
  countryCode: String,
  active: Boolean
}
```

### MasteredRegion

```javascript
{
  appId: String,
  regionName: String,
  regionCode: String,
  active: Boolean,
  masteredCountryId: ObjectId (ref: "MasteredCountry")
}
```

### MasteredDivision

```javascript
{
  appId: String,
  divisionName: String,
  divisionCode: String,
  active: Boolean,
  masteredRegionId: ObjectId (ref: "MasteredRegion"),
  states: [String]
}
```

### MasteredCity

```javascript
{
  appId: String,
  cityName: String,
  cityCode: String,
  latitude: Number,
  longitude: Number,
  location: {
    type: String (enum: ["Point"]),
    coordinates: [Number]
  },
  isActive: Boolean,
  masteredDivisionId: ObjectId (ref: "MasteredDivision")
}
```

### Events (Location Fields)

```javascript
{
  // Legacy field
  regionName: String,
  
  // Mastered location fields
  masteredRegionName: String,
  masteredDivisionName: String,
  masteredCityName: String,
  
  // Venue fields
  venueID: ObjectId (ref: "Venue"),
  venueGeolocation: {
    type: String (enum: ["Point"]),
    coordinates: [Number]
  }
}
```

## Best Practices

1. **Always Use the Complete Hierarchy**  
   When creating events, always include the full hierarchy (region, division, city) to ensure proper filtering and categorization.

2. **Prioritize Mastered Fields**  
   Use the `mastered*` fields rather than the legacy `regionName` field whenever possible.

3. **Handle Geolocation Failures Gracefully**  
   Always provide fallbacks when geolocation fails, such as defaulting to a popular city or the user's last known location.

4. **Optimize for Performance**  
   Use the BatchTool to fetch multiple levels of the hierarchy in parallel when possible.

5. **Validate Permissions**  
   Always verify that a RegionalOrganizer has permission to create events in a given location.

6. **Consider Mobile Users**  
   Mobile users may have more accurate geolocation via browser APIs than IP-based geolocation.

## Future Development

The geo-location system is planned to be enhanced with:

1. Distance-based search capabilities
2. User location preferences
3. Smarter geolocation with multiple fallback mechanisms
4. Improved authorization model for regional organizers
5. Map-based navigation and visualization
6. Integration with favorite venues and organizers