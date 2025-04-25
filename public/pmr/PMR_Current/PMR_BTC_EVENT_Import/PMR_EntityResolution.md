# PMR_BTC_EVENT_Import Entity Resolution

This document provides implementation details for resolving entities (venues, organizers, and categories) during the BTC to TT event import process.

## Entity Resolution Functions

The following functions handle the mapping between BTC entities and TangoTiempo entities:

```javascript
// Entity Resolution Module for BTC Import
const axios = require('axios');
const { mapToTTCategory } = require('../importingBTC/categoryMapping');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010';
const APP_ID = process.env.APP_ID || '1';

// Cache for entity lookups to minimize API calls
const cache = {
  venues: new Map(), // name -> venueId
  organizers: new Map(), // name -> organizerId
  categories: new Map(), // name -> categoryId
  unmatched: {
    venues: new Set(),
    organizers: new Set(),
    categories: new Set()
  }
};

/**
 * Resolves a venue from BTC to TangoTiempo
 * @param {Object} btcVenue - Venue object from BTC API
 * @returns {Promise<string|null>} - TT venueId or null if not found
 */
async function resolveVenue(btcVenue) {
  if (!btcVenue || !btcVenue.venue) {
    console.warn('Empty venue object received');
    return null;
  }

  const venueName = btcVenue.venue;
  
  // Check cache first
  if (cache.venues.has(venueName)) {
    return cache.venues.get(venueName);
  }
  
  // Check if it's in the unmatched cache
  if (cache.unmatched.venues.has(venueName)) {
    return null;
  }
  
  try {
    // Attempt exact match first
    const encodedName = encodeURIComponent(venueName);
    const response = await axios.get(`${API_BASE_URL}/api/venues?appId=${APP_ID}&name=${encodedName}`);
    
    if (response.data && response.data.venues && response.data.venues.length > 0) {
      // Found exact match
      const venueId = response.data.venues[0]._id;
      cache.venues.set(venueName, venueId);
      console.log(`Venue matched: "${venueName}" -> ${venueId}`);
      return venueId;
    }
    
    // If exact match fails, could implement fuzzy matching here
    // For now, log unmatched venue
    console.warn(`Unmatched venue: "${venueName}"`);
    cache.unmatched.venues.add(venueName);
    return null;
  } catch (error) {
    console.error(`Error resolving venue "${venueName}":`, error.message);
    return null;
  }
}

/**
 * Resolves an organizer from BTC to TangoTiempo
 * @param {Object} btcOrganizer - Organizer object from BTC API
 * @returns {Promise<{id: string, name: string}|null>} - TT organizer info or null if not found
 */
async function resolveOrganizer(btcOrganizer) {
  if (!btcOrganizer || !btcOrganizer.organizer) {
    console.warn('Empty organizer object received');
    return null;
  }

  const organizerName = btcOrganizer.organizer;
  
  // Check cache first
  if (cache.organizers.has(organizerName)) {
    return cache.organizers.get(organizerName);
  }
  
  // Check if it's in the unmatched cache
  if (cache.unmatched.organizers.has(organizerName)) {
    return null;
  }
  
  try {
    // Try primary lookup by btcNiceName first (specific integration field)
    const encodedName = encodeURIComponent(organizerName);
    let response = await axios.get(`${API_BASE_URL}/api/organizers?appId=${APP_ID}&btcNiceName=${encodedName}`);
    
    if (response.data && response.data.organizers && response.data.organizers.length > 0) {
      // Found match by btcNiceName
      const organizerInfo = {
        id: response.data.organizers[0]._id,
        name: response.data.organizers[0].fullName || organizerName
      };
      cache.organizers.set(organizerName, organizerInfo);
      console.log(`Organizer matched by btcNiceName: "${organizerName}" -> ${organizerInfo.id}`);
      return organizerInfo;
    }
    
    // Fall back to name matching
    response = await axios.get(`${API_BASE_URL}/api/organizers?appId=${APP_ID}&name=${encodedName}`);
    
    if (response.data && response.data.organizers && response.data.organizers.length > 0) {
      // Found match by name
      const organizerInfo = {
        id: response.data.organizers[0]._id,
        name: response.data.organizers[0].fullName || organizerName
      };
      cache.organizers.set(organizerName, organizerInfo);
      console.log(`Organizer matched by name: "${organizerName}" -> ${organizerInfo.id}`);
      return organizerInfo;
    }
    
    // Log unmatched organizer
    console.warn(`Unmatched organizer: "${organizerName}"`);
    cache.unmatched.organizers.add(organizerName);
    return null;
  } catch (error) {
    console.error(`Error resolving organizer "${organizerName}":`, error.message);
    return null;
  }
}

/**
 * Resolves a category from BTC to TangoTiempo
 * @param {Object} btcCategory - Category object from BTC API
 * @returns {Promise<{id: string, name: string}|null>} - TT category info or null if not found
 */
async function resolveCategory(btcCategory) {
  if (!btcCategory || !btcCategory.name) {
    console.warn('Empty category object received');
    return null;
  }

  const categoryName = btcCategory.name;
  
  // Check cache first
  if (cache.categories.has(categoryName)) {
    return cache.categories.get(categoryName);
  }
  
  // Check if it's in the unmatched cache
  if (cache.unmatched.categories.has(categoryName)) {
    return null;
  }
  
  // Map BTC category to TT category using the mapping file
  const mappedCategoryName = mapToTTCategory(categoryName);
  
  if (!mappedCategoryName) {
    console.warn(`Category ignored or unmapped: "${categoryName}"`);
    cache.unmatched.categories.add(categoryName);
    return null;
  }
  
  try {
    // If we haven't loaded categories yet, load them all at once for efficiency
    if (cache.categories.size === 0) {
      await loadAllCategories();
    }
    
    // Check cache again after loading categories
    if (cache.categories.has(categoryName)) {
      return cache.categories.get(categoryName);
    }
    
    // If still not found, try direct API lookup
    const encodedName = encodeURIComponent(mappedCategoryName);
    const response = await axios.get(`${API_BASE_URL}/api/event-categories?appId=${APP_ID}&categoryName=${encodedName}`);
    
    if (response.data && response.data.categories && response.data.categories.length > 0) {
      // Found match
      const categoryInfo = {
        id: response.data.categories[0]._id,
        name: mappedCategoryName
      };
      cache.categories.set(categoryName, categoryInfo);
      console.log(`Category matched: "${categoryName}" -> ${categoryInfo.id} (${mappedCategoryName})`);
      return categoryInfo;
    }
    
    // Log unmatched category
    console.warn(`Unmatched category: "${categoryName}" -> "${mappedCategoryName}"`);
    cache.unmatched.categories.add(categoryName);
    return null;
  } catch (error) {
    console.error(`Error resolving category "${categoryName}":`, error.message);
    return null;
  }
}

/**
 * Loads all categories from TT API to populate the cache
 * @returns {Promise<void>}
 */
async function loadAllCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/event-categories?appId=${APP_ID}&limit=500`);
    
    if (response.data && response.data.categories) {
      const categories = response.data.categories;
      console.log(`Loaded ${categories.length} categories from API`);
      
      // Create reverse mapping from TT category name to BTC category name
      const reverseMap = new Map();
      for (const [btcName, ttName] of Object.entries(require('../importingBTC/categoryMapping').categoryNameMap)) {
        reverseMap.set(ttName, btcName);
      }
      
      // Populate cache
      for (const category of categories) {
        const ttName = category.categoryName;
        const btcName = reverseMap.get(ttName);
        
        if (btcName) {
          cache.categories.set(btcName, {
            id: category._id,
            name: ttName
          });
        }
      }
      
      console.log(`Cached ${cache.categories.size} category mappings`);
    }
  } catch (error) {
    console.error('Error loading categories:', error.message);
  }
}

/**
 * Retrieves venue geographic information for an event
 * @param {string} venueId - TT venueId
 * @returns {Promise<Object|null>} - Geographic hierarchy info or null
 */
async function getVenueGeography(venueId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/venues/${venueId}?populate=true`);
    
    if (response.data) {
      const venue = response.data;
      return {
        venueGeolocation: venue.geolocation,
        masteredCityId: venue.masteredCityId?._id || venue.masteredCityId,
        masteredCityName: venue.masteredCityId?.cityName || '',
        masteredDivisionId: venue.masteredDivisionId?._id || venue.masteredDivisionId,
        masteredDivisionName: venue.masteredDivisionId?.divisionName || '',
        masteredRegionId: venue.masteredRegionId?._id || venue.masteredRegionId,
        masteredRegionName: venue.masteredRegionId?.regionName || '',
      };
    }
    return null;
  } catch (error) {
    console.error(`Error getting venue geography for ${venueId}:`, error.message);
    return null;
  }
}

/**
 * Generates a report of unmatched entities
 * @returns {Object} - Report of unmatched entities
 */
function getUnmatchedReport() {
  return {
    venues: Array.from(cache.unmatched.venues),
    organizers: Array.from(cache.unmatched.organizers),
    categories: Array.from(cache.unmatched.categories),
    stats: {
      totalVenues: cache.venues.size,
      totalOrganizers: cache.organizers.size,
      totalCategories: cache.categories.size,
      unmatchedVenues: cache.unmatched.venues.size,
      unmatchedOrganizers: cache.unmatched.organizers.size,
      unmatchedCategories: cache.unmatched.categories.size
    }
  };
}

module.exports = {
  resolveVenue,
  resolveOrganizer,
  resolveCategory,
  getVenueGeography,
  getUnmatchedReport,
  loadAllCategories
};
```

## Usage Examples

### Resolving All Entities for an Event

```javascript
const {
  resolveVenue,
  resolveOrganizer,
  resolveCategory,
  getVenueGeography
} = require('./entityResolution');

/**
 * Resolves all entities for a BTC event and returns TT mappings
 * @param {Object} btcEvent - Event from BTC API
 * @returns {Promise<Object>} - Resolved entities and status
 */
async function resolveEventEntities(btcEvent) {
  // Track resolution status
  const result = {
    resolved: true,
    entities: {},
    geography: null,
    errors: []
  };

  try {
    // Resolve venue
    if (btcEvent.venue) {
      const venueId = await resolveVenue(btcEvent.venue);
      if (venueId) {
        result.entities.venueId = venueId;
        
        // Get venue geography for the event
        const geography = await getVenueGeography(venueId);
        if (geography) {
          result.geography = geography;
        } else {
          result.errors.push('Failed to retrieve venue geography');
        }
      } else {
        result.resolved = false;
        result.errors.push('Venue not resolved');
      }
    } else {
      result.errors.push('No venue provided');
    }
    
    // Resolve organizer
    if (btcEvent.organizer) {
      const organizerInfo = await resolveOrganizer(btcEvent.organizer);
      if (organizerInfo) {
        result.entities.organizerId = organizerInfo.id;
        result.entities.organizerName = organizerInfo.name;
      } else {
        result.resolved = false;
        result.errors.push('Organizer not resolved');
      }
    } else {
      result.errors.push('No organizer provided');
    }
    
    // Resolve category (use first category as primary)
    if (btcEvent.categories && btcEvent.categories.length > 0) {
      const categoryInfo = await resolveCategory(btcEvent.categories[0]);
      if (categoryInfo) {
        result.entities.categoryFirstId = categoryInfo.id;
        result.entities.categoryFirst = categoryInfo.name;
      } else {
        // Category is optional, don't fail resolution
        result.errors.push('Primary category not resolved');
      }
      
      // Handle secondary category if available
      if (btcEvent.categories.length > 1) {
        const secondaryCategoryInfo = await resolveCategory(btcEvent.categories[1]);
        if (secondaryCategoryInfo) {
          result.entities.categorySecondId = secondaryCategoryInfo.id;
          result.entities.categorySecond = secondaryCategoryInfo.name;
        }
      }
    } else {
      result.errors.push('No categories provided');
    }
    
    return result;
  } catch (error) {
    console.error('Error resolving event entities:', error);
    result.resolved = false;
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}
```

## Entity Resolution Process Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Extract     │     │     Lookup      │     │      Apply      │
│   BTC Entities  │────▶│   in TT API     │────▶│   to TT Event   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
┌─────────────────┐     ┌─────────────────┐ No  ┌─────────────────┐
│   Geographic    │     │  All Required   │────▶│    Log for      │
│   Enrichment    │◀────│  Entities Found │     │ Manual Review   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │ Yes
        │                       ▼
        │               ┌─────────────────┐
        └───────────────▶   Create/Update │
                        │    TT Event     │
                        └─────────────────┘
```

## Manual Resolution Process

For entities that cannot be automatically matched:

1. Generate unmatched report using `getUnmatchedReport()`
2. Present in admin UI or export to CSV for review
3. Operators can:
   - Create missing entities in TT
   - Update the mapping configuration
   - Add `btcNiceName` to existing organizers for proper matching
   - Skip specific entities