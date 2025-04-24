/**
 * Organizers API - Proxy to backend API
 * This route proxies requests to the backend organizers API
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
    console.log(`Proxying organizers request to backend: ${BE_URL}/api/organizers?${queryParams.toString()}`);
    
    try {
      // Set a reasonable timeout for the backend request
      const response = await axios.get(`${BE_URL}/api/organizers?${queryParams.toString()}`, {
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
      
      // Forward any other backend error
      const status = backendError.response?.status || 500;
      const message = backendError.response?.data?.message || backendError.message || 'Backend API error';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error('Error processing organizers request:', error.message);
    
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
    const appId = body.appId || '1';
    
    // Validate request - check for required fields
    if (!body.fullName && !body.name) {
      return NextResponse.json({
        error: 'Organizer name is required',
        field: 'fullName/name'
      }, { status: 400 });
    }
    
    if (!body.shortName) {
      return NextResponse.json({
        error: 'Short name is required',
        field: 'shortName'
      }, { status: 400 });
    }
    
    // Ensure appId is included
    const requestBody = { ...body, appId };
    
    console.log(`Proxying POST organizer request to backend: ${BE_URL}/api/organizers`);
    
    try {
      const response = await axios.post(`${BE_URL}/api/organizers`, requestBody);
      
      console.log('Organizer created successfully');
      return NextResponse.json(
        { message: 'Organizer created successfully', organizer: response.data },
        { status: 201 }
      );
    } catch (backendError) {
      console.error('Backend API error during organizer creation:', backendError.message);
      
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
      
      // Forward validation errors
      if (backendError.response?.status === 400) {
        return NextResponse.json(
          backendError.response.data,
          { status: 400 }
        );
      }
      
      // Forward any other backend error
      const status = backendError.response?.status || 500;
      const message = backendError.response?.data?.message || backendError.message || 'Error creating organizer';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error('Error processing organizer creation request:', error.message);
    
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