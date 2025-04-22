/**
 * Events API - Proxy to backend API
 * This route proxies requests to the backend events API
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
      queryParams.append(key, value);
    });
    
    // Logging the API request
    console.log(`Proxying events request to backend: ${BE_URL}/api/events?${queryParams.toString()}`);
    
    const response = await axios.get(`${BE_URL}/api/events?${queryParams.toString()}`);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error proxying events request:', error.message);
    
    // Structured error response
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
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
    
    // Ensure appId is set in both URL and body
    const url = `${BE_URL}/api/events/post?appId=${appId}`;
    const requestBody = { ...body, appId };
    
    console.log(`Proxying POST events request to backend: ${url}`);
    const response = await axios.post(url, requestBody);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error proxying POST events request:', error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown server error';
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}