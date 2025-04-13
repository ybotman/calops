import { NextResponse } from 'next/server';
import axios from 'axios';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
initAdmin();

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

// POST handler - Create a new user with Firebase authentication
export async function POST(request) {
  try {
    const { email, password, firstName, lastName, appId = '1', active = true } = await request.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Create user in Firebase
    const auth = getAuth();
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Prepare data for backend
    const userLoginData = {
      firebaseUserId: firebaseUser.uid,
      appId,
      active,
      localUserInfo: {
        firstName,
        lastName,
        isActive: true,
        isApproved: true,
        isEnabled: true,
      },
      roleIds: [], // Default to no roles
      firebaseUserInfo: {
        email,
        displayName: `${firstName} ${lastName}`,
      }
    };

    // Call backend API to create the user login
    const response = await axios.post(`${BE_URL}/api/userlogins`, userLoginData);

    return NextResponse.json(
      { message: 'User created successfully', ...response.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Determine the appropriate error message and status
    let errorMessage = 'Error creating user';
    let statusCode = 500;
    
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email address is already in use';
      statusCode = 409; // Conflict
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
      statusCode = 400; // Bad Request
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak (minimum 6 characters)';
      statusCode = 400; // Bad Request
    } else if (error.response) {
      // If it's an error response from the API call
      errorMessage = error.response.data?.message || errorMessage;
      statusCode = error.response.status || statusCode;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
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