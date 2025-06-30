import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    const type = searchParams.get('type') || 'all';
    
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    // Use the mastered-locations/all endpoint from the backend
    const response = await axios.get(`${backendUrl}/api/mastered-locations/all`, {
      params: {
        appId,
        isActive: true,
        populate: true
      }
    });
    
    if (!response.data) {
      return NextResponse.json({ 
        countries: [], 
        regions: [], 
        divisions: [], 
        cities: [] 
      });
    }
    
    // Return the data in the expected format
    return NextResponse.json({
      countries: response.data.countries || [],
      regions: response.data.regions || [],
      divisions: response.data.divisions || [],
      cities: response.data.cities || []
    });
    
  } catch (error) {
    console.error('Error in geo-hierarchy route:', error);
    
    // Return empty arrays on error
    return NextResponse.json(
      { 
        countries: [], 
        regions: [], 
        divisions: [], 
        cities: [],
        error: error.message 
      },
      { status: 500 }
    );
  }
}