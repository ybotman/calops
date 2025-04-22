/**
 * Events API - Proxy to backend API for specific event
 * This route proxies requests to the backend events API for a specific event
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// GET specific event by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Proxying GET request for event ${id} to backend`);
    
    try {
      const response = await axios.get(`${BE_URL}/api/events/id/${id}?appId=${appId}`, {
        timeout: 8000 // 8 seconds timeout
      });
      
      return NextResponse.json(response.data);
    } catch (backendError) {
      console.error(`Backend API error when fetching event ${id}:`, backendError.message);
      
      // Error handling based on error type
      if (backendError.code === 'ECONNABORTED') {
        return NextResponse.json(
          { error: 'Backend API request timed out' },
          { status: 504 }
        );
      }
      
      if (backendError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { error: 'Could not connect to backend API' },
          { status: 502 }
        );
      }
      
      // If it's a 404, the event doesn't exist
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { error: `Event with ID ${id} not found` },
          { status: 404 }
        );
      }
      
      // Any other error
      const status = backendError.response?.status || 500;
      const message = backendError.response?.data?.message || backendError.message || 'Error fetching event';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error(`Error processing GET event by ID request:`, error.message);
    
    return NextResponse.json(
      { error: 'Internal server error while fetching event' },
      { status: 500 }
    );
  }
}

// PUT to update an event
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || body.appId || '1';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Proxying PUT request for event ${id} to backend`);
    const response = await axios.put(`${BE_URL}/api/events/${id}?appId=${appId}`, {
      ...body,
      appId
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`Error proxying PUT event request:`, error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// PATCH to update partial event data
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || body.appId || '1';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Proxying PATCH request for event ${id} to backend`);
    const response = await axios.patch(`${BE_URL}/api/events/${id}?appId=${appId}`, {
      ...body,
      appId
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`Error proxying PATCH event request:`, error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

// DELETE an event
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`Proxying DELETE request for event ${id} to backend`);
    const response = await axios.delete(`${BE_URL}/api/events/${id}?appId=${appId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`Error proxying DELETE event request:`, error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}