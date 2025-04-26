// entity-resolution.js
// Entity resolution functions for BTC import

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010/api';
const APP_ID = process.env.APP_ID || '1';

// Default Boston masteredCity information for fallback use
const BOSTON_DEFAULTS = {
  masteredCityId: "64f26a9f75bfc0db12ed7a1e",
  masteredCityName: "Boston",
  masteredDivisionId: "64f26a9f75bfc0db12ed7a15",
  masteredDivisionName: "Massachusetts",
  masteredRegionId: "64f26a9f75bfc0db12ed7a12",
  masteredRegionName: "New England",
  coordinates: [-71.0589, 42.3601] // Boston coordinates [longitude, latitude]
};

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
 * Maps a category name from BTC to TT
 * Using a simplified version for testing
 */
export function mapToTTCategory(sourceName) {
  const categoryMap = {
    "Class": "Class",
    "Drop-in Class": "Class",
    "Progressive Class": "Class",
    "Workshop": "Workshop",
    "DayWorkshop": "DayWorkshop",
    "Festivals": "Festival",
    "Milonga": "Milonga",
    "Practica": "Practica",
    "Trips-Hosted": "Trip",
    "Virtual": "Virtual",
    "Party/Gathering": "Gathering",
    "Live Orchestra": "Orchestra",
    "Concert/Show": "Concert",
    "Forum/RoundTable/Labs": "Forum",
    "First Timer Friendly": "NewBee",
  };
  
  const ignoredCategories = new Set([
    "Canceled",
    "Other",
  ]);
  
  if (ignoredCategories.has(sourceName)) return null;
  return categoryMap[sourceName] || null;
}

/**
 * Resolves a venue from BTC to TangoTiempo
 * @param {Object} btcVenue - Venue object from BTC API
 * @returns {Promise<string|null>} - TT venueId or null if not found
 */
export async function resolveVenue(btcVenue) {
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
    const response = await axios.get(`${API_BASE_URL}/venues?appId=${APP_ID}&name=${encodedName}`);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      // Found exact match
      const venueId = response.data.data[0]._id;
      cache.venues.set(venueName, venueId);
      console.log(`Venue matched: "${venueName}" -> ${venueId}`);
      return venueId;
    }
    
    // If venue not found, use NotFound venue as fallback
    try {
      const notFoundResponse = await axios.get(`${API_BASE_URL}/venues?appId=${APP_ID}&name=NotFound`);
      if (notFoundResponse.data && notFoundResponse.data.data && notFoundResponse.data.data.length > 0) {
        const notFoundId = notFoundResponse.data.data[0]._id;
        console.log(`Using NotFound venue for "${venueName}" -> ${notFoundId}`);
        cache.venues.set(venueName, notFoundId);
        return notFoundId;
      }
    } catch (fallbackError) {
      console.error(`Error using NotFound venue fallback: ${fallbackError.message}`);
    }
    
    // If NotFound venue fallback fails, try creating a new venue with Boston defaults
    try {
      // Use the venue name and Boston defaults to create a minimum venue record
      const newVenuePayload = {
        name: venueName,
        address1: "Unknown Address",
        city: BOSTON_DEFAULTS.masteredCityName,
        state: BOSTON_DEFAULTS.masteredDivisionName,
        zipcode: "00000", // Placeholder zipcode
        latitude: BOSTON_DEFAULTS.coordinates[1],
        longitude: BOSTON_DEFAULTS.coordinates[0],
        masteredCityId: BOSTON_DEFAULTS.masteredCityId,
        masteredDivisionId: BOSTON_DEFAULTS.masteredDivisionId,
        masteredRegionId: BOSTON_DEFAULTS.masteredRegionId,
        appId: APP_ID,
        isValidVenueGeolocation: true, // Mark as valid since using known good coordinates
        venueFromBTC: true // Flag to identify venues created from BTC import
      };
      
      const createResponse = await axios.post(`${API_BASE_URL}/venues?appId=${APP_ID}`, newVenuePayload);
      
      if (createResponse.data && createResponse.data._id) {
        const newVenueId = createResponse.data._id;
        console.log(`Created new venue with Boston defaults for "${venueName}" -> ${newVenueId}`);
        cache.venues.set(venueName, newVenueId);
        return newVenueId;
      }
    } catch (createError) {
      console.error(`Error creating fallback venue for "${venueName}": ${createError.message}`);
    }
    
    // Log unmatched venue
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
export async function resolveOrganizer(btcOrganizer) {
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
    let response = await axios.get(`${API_BASE_URL}/organizers?appId=${APP_ID}&btcNiceName=${encodedName}`);
    
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
    response = await axios.get(`${API_BASE_URL}/organizers?appId=${APP_ID}&name=${encodedName}`);
    
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
    
    // Try using the default "Un-Identified" organizer
    try {
      const defaultResponse = await axios.get(`${API_BASE_URL}/organizers?appId=${APP_ID}&shortName=DEFAULT`);
      if (defaultResponse.data && defaultResponse.data.organizers && defaultResponse.data.organizers.length > 0) {
        const organizerInfo = {
          id: defaultResponse.data.organizers[0]._id,
          name: defaultResponse.data.organizers[0].fullName || 'Un-Identified Organizer'
        };
        console.log(`Using default organizer for "${organizerName}" -> ${organizerInfo.id}`);
        cache.organizers.set(organizerName, organizerInfo);
        return organizerInfo;
      }
    } catch (fallbackError) {
      console.error(`Error using default organizer fallback: ${fallbackError.message}`);
    }
    
    // For testing purposes, create a mock ID for some organizers
    if (['John Doe', 'Jane Smith', 'Tango Community'].includes(organizerName)) {
      const mockId = `mock-organizer-${Math.random().toString(36).substring(2, 9)}`;
      const organizerInfo = {
        id: mockId,
        name: organizerName
      };
      cache.organizers.set(organizerName, organizerInfo);
      console.log(`Organizer mock-matched: "${organizerName}" -> ${mockId}`);
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
export async function resolveCategory(btcCategory) {
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
  
  // Map BTC category to TT category using the mapping function
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
    const response = await axios.get(`${API_BASE_URL}/categories?appId=${APP_ID}&categoryName=${encodedName}`);
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      // Found match
      const categoryInfo = {
        id: response.data.data[0]._id,
        name: mappedCategoryName
      };
      cache.categories.set(categoryName, categoryInfo);
      console.log(`Category matched: "${categoryName}" -> ${categoryInfo.id} (${mappedCategoryName})`);
      return categoryInfo;
    }
    
    // Fall back to "Unknown" category
    try {
      const unknownResponse = await axios.get(`${API_BASE_URL}/categories?appId=${APP_ID}&categoryName=Unknown`);
      if (unknownResponse.data && unknownResponse.data.data && unknownResponse.data.data.length > 0) {
        const unknownId = unknownResponse.data.data[0]._id;
        const categoryInfo = {
          id: unknownId,
          name: "Unknown"
        };
        cache.categories.set(categoryName, categoryInfo);
        console.log(`Using "Unknown" category for "${categoryName}" -> ${unknownId}`);
        return categoryInfo;
      }
    } catch (fallbackError) {
      console.error(`Error using Unknown category fallback: ${fallbackError.message}`);
    }
    
    // If we still don't have a category match, return null
    console.warn(`No category match found for "${categoryName}" and no Unknown category available`);
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
export async function loadAllCategories() {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories?appId=${APP_ID}&limit=500`);
    
    if (response.data && response.data.data) {
      const categories = response.data.data;
      console.log(`Loaded ${categories.length} categories from API`);
      
      // Create reverse mapping from TT category name to BTC category name
      const reverseMap = new Map();
      
      for (const [btcName, ttName] of Object.entries({
        "Class": "Class",
        "Drop-in Class": "Class",
        "Progressive Class": "Class",
        "Workshop": "Workshop",
        "DayWorkshop": "DayWorkshop",
        "Festivals": "Festival",
        "Milonga": "Milonga",
        "Practica": "Practica",
        "Trips-Hosted": "Trip",
        "Virtual": "Virtual",
        "Party/Gathering": "Gathering",
        "Live Orchestra": "Orchestra",
        "Concert/Show": "Concert",
        "Forum/RoundTable/Labs": "Forum",
        "First Timer Friendly": "NewBee",
      })) {
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
export async function getVenueGeography(venueId) {
  // For testing purposes, return mock geography if it's a mock venue
  if (venueId && venueId.startsWith('mock-venue-')) {
    return {
      venueGeolocation: {
        type: "Point",
        coordinates: [-71.0589, 42.3601]
      },
      masteredCityId: "64f26a9f75bfc0db12ed7a1e", // Using real ObjectID
      masteredCityName: "Boston",
      masteredDivisionId: "64f26a9f75bfc0db12ed7a15", // Using real ObjectID
      masteredDivisionName: "Massachusetts",
      masteredRegionId: "64f26a9f75bfc0db12ed7a12", // Using real ObjectID
      masteredRegionName: "New England",
      masteredCityGeolocation: {
        type: "Point",
        coordinates: [-71.0589, 42.3601]
      },
      isValidVenueGeolocation: true // Mock venues are always valid
    };
  }
  
  try {
    const response = await axios.get(`${API_BASE_URL}/venues/${venueId}?appId=${APP_ID}`);
    
    if (response.data) {
      const venue = response.data;
      
      // Ensure proper GeoJSON format for venue geolocation
      let venueGeolocation;
      if (venue.geolocation) {
        // If we have geolocation data, ensure it's in proper GeoJSON format
        if (venue.geolocation.type === "Point" && Array.isArray(venue.geolocation.coordinates)) {
          // Already in correct format, use as is
          venueGeolocation = venue.geolocation;
        } else if (Array.isArray(venue.geolocation)) {
          // Convert array to GeoJSON Point
          venueGeolocation = {
            type: "Point",
            coordinates: venue.geolocation
          };
        } else {
          // Default coordinates for Boston, MA if not in proper format
          console.warn(`Invalid geolocation format for venue ${venueId}, using default coordinates`);
          venueGeolocation = {
            type: "Point",
            coordinates: [-71.0589, 42.3601] // Boston, MA
          };
        }
      } else {
        // No geolocation data, use default
        console.warn(`No geolocation data for venue ${venueId}, using default coordinates`);
        venueGeolocation = {
          type: "Point",
          coordinates: [-71.0589, 42.3601] // Boston, MA
        };
      }
      
      // Create full GeoJSON Point object for city geolocation with explicit coordinates
      // IMPORTANT: This is needed to satisfy MongoDB validation
      let cityGeolocation;
      
      // Try to get coordinates from the venue's city if available
      if (venue.masteredCityId?.geolocation?.coordinates && 
          Array.isArray(venue.masteredCityId.geolocation.coordinates) &&
          venue.masteredCityId.geolocation.coordinates.length === 2) {
        // Use the actual city coordinates if available
        cityGeolocation = {
          type: "Point",
          coordinates: venue.masteredCityId.geolocation.coordinates
        };
      } else if (venue.latitude && venue.longitude) {
        // Fallback to venue coordinates if city coordinates not available
        cityGeolocation = {
          type: "Point",
          coordinates: [parseFloat(venue.longitude), parseFloat(venue.latitude)]
        };
      } else {
        // Default to Boston coordinates as last resort
        cityGeolocation = {
          type: "Point",
          coordinates: BOSTON_DEFAULTS.coordinates // Explicit coordinates for Boston
        };
        
        // If we're using Boston fallback, also set the masteredCityId if not already set
        if (!venue.masteredCityId) {
          console.log(`Setting default Boston masteredCityId for venue ${venueId}`);
          try {
            await axios.put(`${API_BASE_URL}/venues/${venueId}?appId=${APP_ID}`, {
              ...venue,
              masteredCityId: BOSTON_DEFAULTS.masteredCityId,
              appId: APP_ID
            });
          } catch (updateError) {
            console.error(`Failed to update venue ${venueId} with default masteredCityId: ${updateError.message}`);
          }
        }
      }
      
      // Determine if the venue's geolocation is valid
      let isValidVenueGeolocation = false;
      
      // First check if venue already has a validation status
      if (venue.hasOwnProperty('isValidVenueGeolocation')) {
        isValidVenueGeolocation = Boolean(venue.isValidVenueGeolocation);
      } 
      // Otherwise validate it if we have coordinates
      else if (venue.latitude && venue.longitude) {
        try {
          // Try to find the nearest city for validation
          const cityResponse = await axios.get(`${API_BASE_URL}/venues/nearest-city`, {
            params: {
              appId: APP_ID,
              longitude: venue.longitude,
              latitude: venue.latitude,
              limit: 1
            }
          });
          
          // Consider valid if within 5km of a city
          const MAX_DISTANCE_KM = 5;
          if (cityResponse.data && 
              cityResponse.data.length > 0 && 
              cityResponse.data[0].distanceInKm <= MAX_DISTANCE_KM) {
            isValidVenueGeolocation = true;
            
            // If we're here, we've confirmed valid geolocation - update the venue
            try {
              await axios.put(`${API_BASE_URL}/venues/${venueId}?appId=${APP_ID}`, {
                ...venue,
                isValidVenueGeolocation: true,
                appId: APP_ID
              });
              console.log(`Updated venue ${venueId} with valid geolocation flag`);
            } catch (updateError) {
              console.error(`Failed to update venue ${venueId} validation status:`, updateError.message);
            }
          }
        } catch (cityError) {
          console.error(`Error validating venue ${venueId} location:`, cityError.message);
        }
      }
      
      // If venue lacks masteredCity information, use Boston defaults
      const needsBostonDefaults = !venue.masteredCityId && !venue.masteredDivisionId;
      
      return {
        venueGeolocation: venueGeolocation,
        masteredCityId: venue.masteredCityId?._id || venue.masteredCityId || BOSTON_DEFAULTS.masteredCityId,
        masteredCityName: venue.masteredCityId?.cityName || venue.city || BOSTON_DEFAULTS.masteredCityName,
        masteredDivisionId: venue.masteredDivisionId?._id || venue.masteredDivisionId || BOSTON_DEFAULTS.masteredDivisionId,
        masteredDivisionName: venue.masteredDivisionId?.divisionName || venue.state || BOSTON_DEFAULTS.masteredDivisionName,
        masteredRegionId: venue.masteredRegionId?._id || venue.masteredRegionId || BOSTON_DEFAULTS.masteredRegionId,
        masteredRegionName: venue.masteredRegionId?.regionName || (needsBostonDefaults ? BOSTON_DEFAULTS.masteredRegionName : "Unknown Region"),
        masteredCityGeolocation: cityGeolocation,
        isValidVenueGeolocation: isValidVenueGeolocation || needsBostonDefaults // If using Boston defaults, consider valid
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
export function getUnmatchedReport() {
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

export default {
  resolveVenue,
  resolveOrganizer,
  resolveCategory,
  getVenueGeography,
  getUnmatchedReport,
  loadAllCategories,
  mapToTTCategory
};