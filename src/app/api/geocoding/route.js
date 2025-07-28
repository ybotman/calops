import { NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(identifier) {
  const now = Date.now();
  const userRecord = rateLimiter.get(identifier);
  
  if (!userRecord || now - userRecord.windowStart > RATE_LIMIT_WINDOW) {
    rateLimiter.set(identifier, { windowStart: now, count: 1 });
    return true;
  }
  
  if (userRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  userRecord.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimiter.entries()) {
    if (now - value.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimiter.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

export async function POST(request) {
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Geocoding service not configured. Please add GOOGLE_MAPS_API_KEY to your .env.local file. See .env.local.example for instructions.' 
        },
        { status: 503 }
      );
    }

    // Get client identifier for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const identifier = `${ip}-${userAgent}`;
    
    // Check rate limit
    if (!checkRateLimit(identifier)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please wait a moment and try again.' 
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { address1, address2, city, state, zip, country } = body;

    // Validate required fields
    if (!address1 && !city) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please provide at least a street address or city.' 
        },
        { status: 400 }
      );
    }

    // Build address string
    const addressParts = [
      address1,
      address2,
      city,
      state,
      zip,
      country || 'USA'
    ].filter(Boolean);
    
    const addressString = addressParts.join(', ');

    // Call Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${apiKey}`;
    
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    // Handle API errors
    if (geocodeData.status === 'ZERO_RESULTS') {
      return NextResponse.json({
        success: false,
        error: 'Address not found. Please verify the address is correct.'
      });
    }

    if (geocodeData.status !== 'OK') {
      console.error('Geocoding API error:', geocodeData.status, geocodeData.error_message);
      return NextResponse.json({
        success: false,
        error: 'Unable to geocode address. Please try again later.'
      });
    }

    // Extract the best result
    const result = geocodeData.results[0];
    const location = result.geometry.location;
    
    // Determine confidence based on result type
    let confidence = 'LOW';
    if (result.geometry.location_type === 'ROOFTOP') {
      confidence = 'HIGH';
    } else if (result.geometry.location_type === 'RANGE_INTERPOLATED') {
      confidence = 'MEDIUM';
    }

    // Return successful response
    return NextResponse.json({
      success: true,
      coordinates: {
        latitude: location.lat,
        longitude: location.lng
      },
      confidence,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      locationType: result.geometry.location_type
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
}