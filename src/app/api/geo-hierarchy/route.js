/**
 * Geo Hierarchy API - Proxy to backend API
 * This route proxies requests to the backend geo hierarchy API
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    const type = searchParams.get('type') || 'all'; // country, region, division, city, or all
    
    // Required parameters to validate
    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['country', 'region', 'division', 'city', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city, all' },
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
    
    // Determine the appropriate backend endpoint based on type
    let endpoint = '';
    
    switch (type) {
      case 'country':
        endpoint = '/api/masteredLocations/countries';
        break;
      case 'region':
        endpoint = '/api/masteredLocations/regions';
        break;
      case 'division':
        endpoint = '/api/masteredLocations/divisions';
        break;
      case 'city':
        endpoint = '/api/masteredLocations/cities';
        break;
      case 'all':
      default:
        // For 'all', we'll need to make multiple requests
        endpoint = '/api/masteredLocations/all';
        break;
    }
    
    // Logging the API request
    console.log(`Proxying geo-hierarchy request to backend: ${BE_URL}${endpoint}?${queryParams.toString()}`);
    
    try {
      // Set a reasonable timeout for the backend request
      const response = await axios.get(`${BE_URL}${endpoint}?${queryParams.toString()}`, {
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
    console.error('Error processing geo-hierarchy request:', error.message);
    
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
    const { type, ...itemData } = body;
    const appId = itemData.appId || '1';
    
    // Validate required parameters
    if (!type) {
      return NextResponse.json(
        { error: 'Geo hierarchy type is required' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Determine the appropriate backend endpoint based on type
    let endpoint = '';
    
    switch (type) {
      case 'country':
        endpoint = '/api/masteredLocations/countries';
        break;
      case 'region':
        endpoint = '/api/masteredLocations/regions';
        break;
      case 'division':
        endpoint = '/api/masteredLocations/divisions';
        break;
      case 'city':
        endpoint = '/api/masteredLocations/cities';
        break;
    }
    
    // Ensure appId is set
    const requestBody = { ...itemData, appId, type };
    
    console.log(`Proxying POST geo-hierarchy request to backend: ${BE_URL}${endpoint}`);
    
    try {
      const response = await axios.post(`${BE_URL}${endpoint}`, requestBody);
      
      console.log('Geo hierarchy item created successfully');
      return NextResponse.json(
        { 
          message: `${type} created successfully`, 
          item: response.data 
        },
        { status: 201 }
      );
    } catch (backendError) {
      console.error('Backend API error during geo hierarchy creation:', backendError.message);
      
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
      const message = backendError.response?.data?.message || backendError.message || `Error creating ${type}`;
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error('Error processing geo hierarchy creation request:', error.message);
    
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

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const appId = searchParams.get('appId') || '1';
    
    // Validate required parameters
    if (!type || !id) {
      return NextResponse.json(
        { error: 'Geo hierarchy type and ID are required' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Determine the appropriate backend endpoint based on type
    let endpoint = '';
    
    switch (type) {
      case 'country':
        endpoint = `/api/masteredLocations/countries/${id}`;
        break;
      case 'region':
        endpoint = `/api/masteredLocations/regions/${id}`;
        break;
      case 'division':
        endpoint = `/api/masteredLocations/divisions/${id}`;
        break;
      case 'city':
        endpoint = `/api/masteredLocations/cities/${id}`;
        break;
    }
    
    // Logging the API request
    console.log(`Proxying DELETE geo-hierarchy request to backend: ${BE_URL}${endpoint}?appId=${appId}`);
    
    try {
      const response = await axios.delete(`${BE_URL}${endpoint}?appId=${appId}`);
      
      console.log(`${type} deleted successfully`);
      return NextResponse.json({ message: `${type} deleted successfully` });
    } catch (backendError) {
      console.error('Backend API error during geo hierarchy deletion:', backendError.message);
      
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
      
      // Check for dependency errors (400) or not found errors (404)
      if (backendError.response?.status === 400) {
        return NextResponse.json(
          { error: backendError.response.data?.message || `Cannot delete ${type}: it is referenced by other items` },
          { status: 400 }
        );
      }
      
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { error: `${type} with ID ${id} not found` },
          { status: 404 }
        );
      }
      
      // Forward any other backend error
      const status = backendError.response?.status || 500;
      const message = backendError.response?.data?.message || backendError.message || `Error deleting ${type}`;
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error('Error processing geo hierarchy deletion request:', error.message);
    
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