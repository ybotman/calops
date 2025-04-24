/**
 * Venue by ID API - Proxy to backend API
 * This route proxies requests to the backend venues API for a specific venue
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    const venueId = params.id;
    
    // Required parameters to validate
    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    if (!venueId) {
      return NextResponse.json(
        { error: 'venue ID is required' },
        { status: 400 }
      );
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    // Logging the API request
    console.log(`Proxying venue request to backend: ${BE_URL}/api/venues/${venueId}?${queryParams.toString()}`);
    
    try {
      // Set a reasonable timeout for the backend request
      const response = await axios.get(`${BE_URL}/api/venues/${venueId}?${queryParams.toString()}`, {
        timeout: 10000 // 10 seconds
      });
      
      // Check if the response is as expected
      if (response.data) {
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
      
      // Check for 404 errors specifically
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Venue not found' },
          { status: 404 }
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
    console.error('Error processing venue request:', error.message);
    
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

export async function PUT(request, { params }) {
  try {
    const venueId = params.id;
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
    
    if (!venueId) {
      return NextResponse.json(
        { error: 'venue ID is required' },
        { status: 400 }
      );
    }
    
    // Ensure appId is set in both URL and body
    const url = `${BE_URL}/api/venues/${venueId}?appId=${appId}`;
    const requestBody = { ...body, appId };
    
    console.log(`Proxying PUT venue request to backend: ${url}`);
    const response = await axios.put(url, requestBody);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error proxying PUT venue request:', error.message);
    
    // Check for 404 errors specifically
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }
    
    // Handle validation errors
    if (error.response?.status === 400) {
      return NextResponse.json(
        error.response.data,
        { status: 400 }
      );
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const venueId = params.id;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    // Validate request
    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    if (!venueId) {
      return NextResponse.json(
        { error: 'venue ID is required' },
        { status: 400 }
      );
    }
    
    // Prepare URL with query parameters
    const url = `${BE_URL}/api/venues/${venueId}?appId=${appId}`;
    
    console.log(`Proxying DELETE venue request to backend: ${url}`);
    const response = await axios.delete(url);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error proxying DELETE venue request:', error.message);
    
    // Check for 404 errors specifically
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Venue not found' },
        { status: 404 }
      );
    }
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}