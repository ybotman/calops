import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// GET organizer by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    
    // Fetch organizer from backend
    const response = await axios.get(`${BE_URL}/api/organizers/${id}?appId=${appId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`Error fetching organizer ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch organizer',
      details: error.response?.data?.message || error.message
    }, { status: error.response?.status || 500 });
  }
}

// PATCH update organizer by ID
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    const updates = await request.json();
    
    // Forward request to backend
    const response = await axios.put(`${BE_URL}/api/organizers/${id}?appId=${appId}`, {
      ...updates,
      appId
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`Error updating organizer ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to update organizer',
      details: error.response?.data?.message || error.message
    }, { status: error.response?.status || 500 });
  }
}