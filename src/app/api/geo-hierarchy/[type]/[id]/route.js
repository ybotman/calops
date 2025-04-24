/**
 * Geo Hierarchy by Type and ID API - Proxy to backend API
 * This route proxies requests to the backend geo hierarchy API for specific items
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET(request, { params }) {
  try {
    const { type, id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    // Validate the type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Validate ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
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
    
    // Forward query parameters
    const queryParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      queryParams.append(key, value);
    });
    
    // Logging the API request
    console.log(`Proxying geo-hierarchy GET request to backend: ${BE_URL}${endpoint}?${queryParams.toString()}`);
    
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
      
      // Check for 404 errors specifically
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { error: `${type} not found` },
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

export async function PUT(request, { params }) {
  try {
    const { type, id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    const body = await request.json();
    
    // Validate the type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Validate ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
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
    
    // Ensure appId is in the body
    const requestBody = { ...body, appId };
    
    // Logging the API request
    console.log(`Proxying geo-hierarchy PUT request to backend: ${BE_URL}${endpoint}`);
    
    try {
      const response = await axios.put(`${BE_URL}${endpoint}?appId=${appId}`, requestBody);
      
      console.log(`${type} updated successfully`);
      return NextResponse.json({
        message: `${type} updated successfully`,
        item: response.data
      });
    } catch (backendError) {
      console.error('Backend API error during geo hierarchy update:', backendError.message);
      
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
      
      // Check for validation errors
      if (backendError.response?.status === 400) {
        return NextResponse.json(
          backendError.response.data,
          { status: 400 }
        );
      }
      
      // Check for 404 errors specifically
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { error: `${type} not found` },
          { status: 404 }
        );
      }
      
      // Forward any other backend error
      const status = backendError.response?.status || 500;
      const message = backendError.response?.data?.message || backendError.message || `Error updating ${type}`;
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error(`Error processing geo-hierarchy update request:`, error.message);
    
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

export async function DELETE(request, { params }) {
  try {
    const { type, id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    // Validate the type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Validate ID is provided
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
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
    console.log(`Proxying geo-hierarchy DELETE request to backend: ${BE_URL}${endpoint}?appId=${appId}`);
    
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
      
      // Check for dependency errors
      if (backendError.response?.status === 400) {
        return NextResponse.json(
          { error: backendError.response.data?.message || `Cannot delete ${type}: it is referenced by other items` },
          { status: 400 }
        );
      }
      
      // Check for 404 errors specifically
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { error: `${type} not found` },
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
    console.error('Error processing geo-hierarchy deletion request:', error.message);
    
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