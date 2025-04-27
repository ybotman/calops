/**
 * Venues API - Proxy to backend API
 * This route proxies requests to the backend venues API
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    // Required parameters to validate
    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend API with all query parameters
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      // Log each parameter being forwarded (helpful for debugging)
      console.log(`Forwarding parameter: ${key}=${value}`);
      queryParams.append(key, value);
    });
    
    // Logging the API request
    console.log(`Proxying venues request to backend: ${BE_URL}/api/venues?${queryParams.toString()}`);
    
    try {
      // Set a reasonable timeout for the backend request
      const response = await axios.get(`${BE_URL}/api/venues?${queryParams.toString()}`, {
        timeout: 10000 // 10 seconds
      });
      
      // Check if the response is as expected
      if (response.data) {
        // Forward the response directly without wrapping in data object
        return NextResponse.json(response.data);
      } else {
        throw new Error('Invalid response format from backend API');
      }
    } catch (backendError) {
      console.error('Backend API error:', backendError.message);
      
      // Check if this is a timeout error
      if (backendError.code === 'ECONNABORTED') {
        return NextResponse.json(
          { 
            error: 'Backend API request timed out',
            details: 'The backend server took too long to respond' 
          },
          { status: 504 }
        );
      }
      
      // Check if this is a connection error
      if (backendError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            error: 'Could not connect to backend API',
            details: 'Please ensure the backend server is running' 
          },
          { status: 502 }
        );
      }
      
      // Forward any other backend error
      const status = backendError.response?.status || 500;
      const message = backendError.response?.data?.message || backendError.message || 'Backend API error';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error('Error processing venues request:', error.message);
    
    // Structured error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message || 'Unknown server error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || body.appId || '1';
    
    // Validate request
    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    // Handle missing coordinates by looking up masteredCityId
    if ((!body.latitude || !body.longitude) && body.masteredCityId) {
      try {
        // Try to get coordinates from city
        const cityResponse = await axios.get(`${BE_URL}/api/geo-hierarchy/cities/${body.masteredCityId}?appId=${appId}`);
        
        if (cityResponse.data && cityResponse.data.geolocation && 
            cityResponse.data.geolocation.coordinates && 
            cityResponse.data.geolocation.coordinates.length === 2) {
          console.log(`Using coordinates from masteredCity ${body.masteredCityId}`);
          body.longitude = cityResponse.data.geolocation.coordinates[0];
          body.latitude = cityResponse.data.geolocation.coordinates[1];
          body.geolocation = {
            type: "Point",
            coordinates: [body.longitude, body.latitude]
          };
        } else {
          // City found but no coordinates - use Boston defaults
          console.log(`City ${body.masteredCityId} found but no coordinates - using Boston defaults`);
          body.longitude = -71.0589; // Boston longitude
          body.latitude = 42.3601;   // Boston latitude
          body.geolocation = {
            type: "Point",
            coordinates: [body.longitude, body.latitude]
          };
        }
      } catch (cityError) {
        console.error(`Failed to get city coordinates - using Boston defaults:`, cityError.message);
        // Default to Boston coordinates
        body.longitude = -71.0589; // Boston longitude
        body.latitude = 42.3601;   // Boston latitude
        body.geolocation = {
          type: "Point",
          coordinates: [body.longitude, body.latitude]
        };
      }
    }
    
    // Ensure appId is set in both URL and body
    const url = `${BE_URL}/api/venues?appId=${appId}`;
    const requestBody = { ...body, appId };
    
    console.log(`Proxying POST venues request to backend: ${url}`);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 seconds timeout
      });
      
      console.log('Venue creation successful:', response.data);
      return NextResponse.json(response.data);
    } catch (proxyError) {
      console.error('Error from backend venue creation:', proxyError.message);
      if (proxyError.response) {
        console.error('Backend status:', proxyError.response.status);
        console.error('Backend response:', proxyError.response.data);
        
        // Handle specific error cases with more helpful messages
        if (proxyError.response.status === 409) {
          return NextResponse.json(
            { 
              error: 'Duplicate venue', 
              details: proxyError.response.data?.error || proxyError.response.data?.message,
              suggestion: 'This venue appears to already exist in the system.' 
            },
            { status: 409 }
          );
        }
        
        // Handle geoNear index error (500) - likely due to a missing geospatial index when checking for duplicates
        if (proxyError.response.status === 500 && 
            proxyError.response.data?.error?.includes("unable to find index for $geoNear query")) {
          console.log("Detected missing geoNear index error, removing geolocation for retry");
          
          // Try again without geolocation to bypass the duplicate check
          try {
            // Clone the request body but remove the geolocation field
            const retryBody = { ...requestBody };
            delete retryBody.geolocation;
            
            console.log('Retrying venue creation without geolocation:', JSON.stringify({
              name: retryBody.name,
              city: retryBody.city,
              masteredCityId: retryBody.masteredCityId
            }));
            
            const retryResponse = await axios.post(url, retryBody, {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 15000
            });
            
            console.log('Venue creation successful without geolocation:', retryResponse.data);
            return NextResponse.json({
              ...retryResponse.data,
              note: 'Created without geolocation due to backend index issue'
            });
          } catch (retryError) {
            console.error('Retry without geolocation failed:', retryError.message);
            // Fall through to regular error handling
          }
        }
        
        // If error is 404 related to masteredCity, retry with Boston defaults
        if (proxyError.response.status === 404 && 
            (proxyError.response.data?.message === "Provided masteredCityId not found" ||
             proxyError.response.data?.error === "No city found near the provided coordinates")) {
          
          try {
            // Try again with Boston defaults
            const retryBody = {
              ...requestBody,
              masteredCityId: "64f26a9f75bfc0db12ed7a1e", // Boston city ID 
              masteredDivisionId: "64f26a9f75bfc0db12ed7a15", // Massachusetts division ID
              masteredRegionId: "64f26a9f75bfc0db12ed7a12" // New England region ID
            };
            
            // Ensure we have coordinates
            if (!retryBody.latitude || !retryBody.longitude) {
              retryBody.latitude = 42.3601; // Boston latitude
              retryBody.longitude = -71.0589; // Boston longitude
              retryBody.geolocation = {
                type: "Point",
                coordinates: [retryBody.longitude, retryBody.latitude]
              };
            }
            
            console.log('Retrying venue creation with Boston defaults:', JSON.stringify({
              name: retryBody.name,
              city: retryBody.city,
              masteredCityId: retryBody.masteredCityId
            }));
            
            const retryResponse = await axios.post(url, retryBody, {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 15000
            });
            
            console.log('Venue creation successful with Boston defaults:', retryResponse.data);
            return NextResponse.json({
              ...retryResponse.data,
              note: 'Created with Boston defaults due to city lookup failure'
            });
          } catch (retryError) {
            console.error('Retry with Boston defaults failed:', retryError.message);
            // Fall through to regular error handling
          }
        }
      }
      throw proxyError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error proxying POST venues request:', error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}