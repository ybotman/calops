import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// GET user by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    
    // Fetch user from backend
    const response = await axios.get(`${BE_URL}/api/userlogins/firebase/${id}?appId=${appId}`);
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch user',
      details: error.response?.data?.message || error.message
    }, { status: error.response?.status || 500 });
  }
}

// PATCH update user by ID
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    const updates = await request.json();
    
    // Add firebaseUserId and appId to the update data
    const updateData = {
      ...updates,
      firebaseUserId: id,
      appId
    };
    
    console.log('API route: sending update to backend:', JSON.stringify(updateData, null, 2));
    
    // Forward request to backend
    const response = await axios.put(`${BE_URL}/api/userlogins/updateUserInfo`, updateData);
    
    return NextResponse.json(response.data.updatedUser);
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error);
    let errorDetails = 'Unknown error';
    if (error.response) {
      console.error('Response data:', error.response.data);
      errorDetails = error.response.data?.message || error.response.data || error.message;
    } else {
      errorDetails = error.message;
    }
    
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: errorDetails
    }, { status: error.response?.status || 500 });
  }
}