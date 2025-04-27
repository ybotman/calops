/**
 * Venue Geolocation Validation API
 * This route validates venue geolocation data and updates the isValidVenueGeolocation flag
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function POST(request) {
  try {
    const body = await request.json();
    const { venueIds, appId = '1', batchSize = 10 } = body;
    
    // Validate request
    if (!venueIds || !Array.isArray(venueIds) || venueIds.length === 0) {
      return NextResponse.json(
        { error: 'venueIds array is required' },
        { status: 400 }
      );
    }
    
    // Process venues in batches to respect API limits
    const results = {
      validated: 0,
      invalid: 0,
      failed: 0,
      details: []
    };
    
    // Process venues in batches
    const batches = [];
    for (let i = 0; i < venueIds.length; i += batchSize) {
      batches.push(venueIds.slice(i, i + batchSize));
    }
    
    // Process each batch with a delay to respect rate limits
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await processBatch(batches[i], appId);
      
      // Merge results
      results.validated += batchResults.validated;
      results.invalid += batchResults.invalid;
      results.failed += batchResults.failed;
      results.details = [...results.details, ...batchResults.details];
      
      // Add delay between batches if not the last batch
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing venue validation:', error);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// Process a batch of venues
async function processBatch(venueIds, appId) {
  const batchResults = {
    validated: 0,
    invalid: 0,
    failed: 0,
    details: []
  };
  
  for (const venueId of venueIds) {
    try {
      // 1. Fetch venue details
      const venueResponse = await axios.get(`${BE_URL}/api/venues/${venueId}?appId=${appId}`);
      const venue = venueResponse.data;
      
      if (!venue) {
        batchResults.failed++;
        batchResults.details.push({
          venueId,
          status: 'failed',
          reason: 'Venue not found'
        });
        continue;
      }
      
      // 2. Check if venue has coordinates
      if (!venue.latitude || !venue.longitude) {
        // If venue has masteredCityId but no coordinates, try to get coordinates from city
        if (venue.masteredCityId) {
          try {
            // Get city details to extract coordinates
            const cityResponse = await axios.get(`${BE_URL}/api/geo-hierarchy/cities/${venue.masteredCityId}?appId=${appId}`);
            
            if (cityResponse.data && cityResponse.data.geolocation && 
                cityResponse.data.geolocation.coordinates && 
                cityResponse.data.geolocation.coordinates.length === 2) {
              // Update venue with city coordinates
              venue.longitude = cityResponse.data.geolocation.coordinates[0];
              venue.latitude = cityResponse.data.geolocation.coordinates[1];
              venue.coordinatesSource = 'masteredCity';
              
              // Save the coordinates
              await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
                ...venue,
                longitude: venue.longitude,
                latitude: venue.latitude,
                coordinatesSource: venue.coordinatesSource,
                appId
              });
              
              console.log(`Updated venue ${venueId} coordinates from masteredCity`);
            } else {
              // City found but no coordinates - use Boston defaults
              venue.longitude = -71.0589; // Boston
              venue.latitude = 42.3601;
              venue.coordinatesSource = 'boston_defaults';
              
              // Save the coordinates
              await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
                ...venue,
                longitude: venue.longitude,
                latitude: venue.latitude,
                coordinatesSource: venue.coordinatesSource,
                appId
              });
              
              console.log(`Updated venue ${venueId} with Boston default coordinates`);
            }
          } catch (cityError) {
            console.error(`Error getting city coordinates for venue ${venueId}:`, cityError.message);
            
            // Use Boston defaults as fallback
            venue.longitude = -71.0589; // Boston
            venue.latitude = 42.3601;
            venue.coordinatesSource = 'boston_defaults_fallback';
            
            // Save the coordinates
            await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
              ...venue,
              longitude: venue.longitude,
              latitude: venue.latitude,
              coordinatesSource: venue.coordinatesSource,
              appId
            });
            
            console.log(`Updated venue ${venueId} with Boston default coordinates after error`);
          }
        } else {
          // No masteredCityId and no coordinates - mark as invalid
          await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
            ...venue,
            isValidVenueGeolocation: false,
            appId
          });
          
          batchResults.invalid++;
          batchResults.details.push({
            venueId,
            venueName: venue.name,
            status: 'invalid',
            reason: 'Missing coordinates and no masteredCity'
          });
          continue;
        }
        
        // If we still don't have coordinates after all attempts, mark as invalid
        if (!venue.latitude || !venue.longitude) {
          await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
            ...venue,
            isValidVenueGeolocation: false,
            appId
          });
          
          batchResults.invalid++;
          batchResults.details.push({
            venueId,
            venueName: venue.name,
            status: 'invalid',
            reason: 'Failed to obtain coordinates'
          });
          continue;
        }
      }
      
      // 2.5. Check if venue has masteredCityId, if not, try to find nearest city first
      if (!venue.masteredCityId) {
        try {
          // Find nearest city to assign
          const nearestCityResponse = await axios.get(`${BE_URL}/api/venues/nearest-city`, {
            params: {
              appId,
              longitude: venue.longitude,
              latitude: venue.latitude,
              limit: 1
            }
          });
          
          // If we found a city, update the venue with the masteredCityId
          if (nearestCityResponse.data && nearestCityResponse.data.length > 0) {
            const nearestCity = nearestCityResponse.data[0];
            const updatedVenueResponse = await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
              ...venue,
              masteredCityId: nearestCity._id,
              appId
            });
            
            // Create a new venue object with the updated data
            const updatedVenue = updatedVenueResponse.data || venue;
            
            // Use the updated venue for subsequent operations
            Object.assign(venue, updatedVenue);
            
            console.log(`Assigned venue ${venueId} to nearest city: ${nearestCity.cityName}`);
          } else {
            // If no city found, use Boston as default (this will be handled later in validation)
            console.log(`No nearest city found for venue ${venueId}, will use fallbacks in validation`);
          }
        } catch (cityError) {
          console.error(`Error finding nearest city for venue ${venueId}:`, cityError);
          // Continue with validation, the remaining logic will handle fallbacks
        }
      }
      
      // 3. Validate coordinates by finding nearest city
      const cityResponse = await axios.get(`${BE_URL}/api/venues/nearest-city`, {
        params: {
          appId,
          longitude: venue.longitude,
          latitude: venue.latitude,
          limit: 1
        }
      });
      
      // 4. Check if nearest city was found within a reasonable distance (5km)
      const MAX_DISTANCE_KM = 5;
      let isValid = cityResponse.data && 
                    cityResponse.data.length > 0 && 
                    cityResponse.data[0].distanceInKm <= MAX_DISTANCE_KM;
      
      // If not valid and this is a BTC venue or has venueFromBTC flag, we'll be more lenient
      const isBtcVenue = venue.venueFromBTC || 
                          (venue.discoveredComments && venue.discoveredComments.includes('BTC'));
      
      if (!isValid && isBtcVenue) {
        console.log(`BTC venue ${venueId} wasn't within distance threshold, but marking as valid for import purposes`);
        isValid = true;
      }
      
      // 5. Update venue with validation result and ensure masteredCityId is set
      // If we still have no masteredCityId, use the nearest city's ID or Boston as fallback
      const venueMasteredCityId = venue.masteredCityId || 
        (cityResponse.data && cityResponse.data.length > 0 ? 
          cityResponse.data[0]._id : 
          "64f26a9f75bfc0db12ed7a1e" // Boston city ID if all else fails
        );
      
      await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
        ...venue,
        isValidVenueGeolocation: isValid,
        masteredCityId: venueMasteredCityId, // Ensure masteredCityId is set
        appId
      });
      
      if (isValid) {
        batchResults.validated++;
        batchResults.details.push({
          venueId,
          venueName: venue.name,
          status: 'valid',
          cityId: cityResponse.data[0]._id,
          cityName: cityResponse.data[0].cityName,
          distanceKm: cityResponse.data[0].distanceInKm
        });
      } else {
        batchResults.invalid++;
        batchResults.details.push({
          venueId,
          venueName: venue.name,
          status: 'invalid',
          reason: cityResponse.data && cityResponse.data.length > 0 
            ? `Too far from nearest city (${cityResponse.data[0].distanceInKm.toFixed(2)}km)` 
            : 'No nearby city found'
        });
      }
    } catch (error) {
      console.error(`Error validating venue ${venueId}:`, error);
      
      batchResults.failed++;
      batchResults.details.push({
        venueId,
        status: 'failed',
        reason: error.message
      });
    }
  }
  
  return batchResults;
}