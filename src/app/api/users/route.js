import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// GET handler - Get all users or filter by parameters
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined;
    
    // Build query string for backend request
    let queryString = `appId=${appId}`;
    if (active !== undefined) {
      queryString += `&active=${active}`;
    }
    
    // Fetch users from backend
    const response = await axios.get(`${BE_URL}/api/userlogins/all?${queryString}`);
    
    // Return the data directly
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users', 
      details: error.message 
    }, { status: 500 });
  }
}

// POST handler - Create a new user
export async function POST(request) {
  try {
    const data = await request.json();
    
    // Forward request to backend
    const response = await axios.post(`${BE_URL}/api/userlogins`, data);
    
    return NextResponse.json(
      { message: 'User created successfully', user: response.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: error.response?.data?.message || error.message 
    }, { status: error.response?.status || 500 });
  }
}

// PATCH handler - Update user
export async function PATCH(request) {
  try {
    const data = await request.json();
    const { firebaseUserId, appId = "1" } = data;
    
    // Forward request to backend
    const response = await axios.put(`${BE_URL}/api/userlogins/updateUserInfo`, data);
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: response.data.updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error.response?.data?.message || error.message 
    }, { status: error.response?.status || 500 });
  }
}