import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// GET handler - Get all roles for an app
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    
    // Fetch roles from backend
    const response = await axios.get(`${BE_URL}/api/roles?appId=${appId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch roles',
      details: error.message
    }, { status: 500 });
  }
}