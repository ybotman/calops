/**
 * Categories API
 * Provides access to event categories for the system
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the backend API
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId') || '1';
  
  try {
    // Try to fetch from the backend API
    const response = await axios.get(`${BE_URL}/api/categories?appId=${appId}`);
    
    // If successful, return the data
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in categories API:', error);
    
    // Return proper error
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch categories';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        endpoint: '/api/categories',
        appId: appId
      },
      { status }
    );
  }
}