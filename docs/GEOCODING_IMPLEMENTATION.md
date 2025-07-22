# Geocoding Implementation Plan

## Overview
This document outlines the implementation of address geocoding functionality for venue management in CalOps.

## Architecture

### Service Provider: Google Geocoding API
- Primary choice due to accuracy and reliability
- Fallback options: Mapbox, OpenCage (future enhancement)

### Components

1. **Environment Configuration**
   - `GOOGLE_MAPS_API_KEY` stored in `.env.local`
   - Example configuration in `.env.example`

2. **API Route** (`/src/app/api/geocoding/route.js`)
   - POST endpoint
   - Input validation
   - Rate limiting (10 requests per minute per session)
   - Error handling with user-friendly messages

3. **API Client** (`/src/lib/api-client.js`)
   - New geocoding namespace
   - `geocodeAddress()` method

4. **Frontend Integration** (`VenueEditDialog.js`)
   - "Geocode from Address" button
   - Auto-geocode on address blur (debounced 1 second)
   - Loading states
   - Confidence indicator
   - Manual override capability

## Implementation Steps

### Step 1: Google Cloud Setup
1. Create/select Google Cloud project
2. Enable Geocoding API
3. Create API key with restrictions:
   - HTTP referrers: `localhost:3000/*`, `your-domain.com/*`
   - API restrictions: Geocoding API only

### Step 2: Backend Implementation
```javascript
// /src/app/api/geocoding/route.js
export async function POST(request) {
  // Validate API key exists
  // Parse request body
  // Format address string
  // Call Google Geocoding API
  // Return formatted response
}
```

### Step 3: Frontend Integration
```javascript
// Add to VenueEditDialog.js
const handleGeocodeAddress = async () => {
  // Collect address fields
  // Call geocoding API
  // Update lat/long fields
  // Show confidence level
}
```

## Request/Response Format

### Request:
```json
{
  "address1": "123 Main Street",
  "address2": "Suite 100",
  "city": "San Francisco",
  "state": "CA",
  "zip": "94105",
  "country": "USA"
}
```

### Response:
```json
{
  "success": true,
  "coordinates": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "confidence": "HIGH",
  "formattedAddress": "123 Main St, San Francisco, CA 94105, USA",
  "placeId": "ChIJ..."
}
```

## Error Handling

1. **Invalid API Key**: "Geocoding service not configured. Please contact administrator."
2. **No Results**: "Address not found. Please verify the address is correct."
3. **Multiple Results**: Return best match with confidence score
4. **Rate Limit**: "Too many requests. Please wait a moment and try again."
5. **Network Error**: "Unable to connect to geocoding service. Please try again."

## Security Considerations

1. API key stored server-side only
2. Rate limiting per session
3. Input validation and sanitization
4. CORS configuration for API route
5. Request logging for abuse monitoring

## Testing Plan

1. Test with various address formats
2. Test error scenarios
3. Test rate limiting
4. Test with incomplete addresses
5. Test international addresses

## Future Enhancements

1. Caching geocoded results
2. Batch geocoding for import
3. Address autocomplete
4. Multiple provider support
5. Reverse geocoding