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
        // Update venue with invalid flag
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
          reason: 'Missing coordinates'
        });
        continue;
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
      const isValid = cityResponse.data && 
                      cityResponse.data.length > 0 && 
                      cityResponse.data[0].distanceInKm <= MAX_DISTANCE_KM;
      
      // 5. Update venue with validation result
      await axios.put(`${BE_URL}/api/venues/${venueId}?appId=${appId}`, {
        ...venue,
        isValidVenueGeolocation: isValid,
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