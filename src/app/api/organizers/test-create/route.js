import { NextResponse } from 'next/server';
import axios from 'axios';
import mongoose from 'mongoose';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

/**
 * Special endpoint for creating test organizers with all required fields
 * Uses a more direct approach to create an organizer
 */
export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Creating test organizer with data:', JSON.stringify(data, null, 2));
    
    // Generate a test Firebase User ID
    const tempFirebaseUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Create user data for the request with minimal required fields
    const userData = {
      firebaseUserId: tempFirebaseUserId,
      firstName: data.name || data.fullName || 'Test',
      lastName: 'User',
      appId: data.appId || '1',
      // Ensure boolean flags are set explicitly
      isApproved: data.isApproved === true ? true : false,
      isActive: data.isActive === true ? true : false,
      isEnabled: data.isEnabled === true ? true : false
    };
    
    console.log('Sending user creation request with data:', userData);
    
    // Create the user
    try {
      const userResponse = await axios.post(`${BE_URL}/api/userlogins`, userData);
      console.log('User creation response status:', userResponse.status);
      console.log('User creation response data:', userResponse.data);
      
      if (!userResponse.data || !userResponse.data._id) {
        // If we don't get a user ID, try to create a simpler test user
        console.log('Did not receive user ID, trying alternative approach');
        return NextResponse.json({
          error: 'Failed to create user properly',
          details: 'User creation did not return a valid ID'
        }, { status: 500 });
      }
      
      const userId = userResponse.data._id;
      console.log('Created user with ID:', userId);
      
      // ALTERNATIVE: Direct approach without organizer creation
      return NextResponse.json({
        message: 'User created successfully',
        user: userResponse.data,
        note: 'Stopping at user creation step for now'
      }, { status: 201 });
      
    } catch (userError) {
      console.error('Error creating user:', userError);
      let errorDetails = 'Unknown error in user creation';
      
      if (userError.response) {
        console.error('User creation response data:', userError.response.data);
        errorDetails = userError.response.data;
      } else {
        errorDetails = userError.message;
      }
      
      return NextResponse.json({
        error: 'Failed to create user',
        details: errorDetails
      }, { status: userError.response?.status || 500 });
    }
  } catch (error) {
    console.error('Overall error in test-create endpoint:', error);
    
    // Extract and format error details for better debugging
    let errorDetails = 'Unknown error';
    if (error.response) {
      console.error('Response data:', error.response.data);
      errorDetails = error.response.data;
    } else {
      errorDetails = error.message;
    }
    
    return NextResponse.json({
      error: 'Failed in the test organizer creation process',
      details: errorDetails
    }, { status: error.response?.status || 500 });
  }
}