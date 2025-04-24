/**
 * Connect user to organizer API - Proxy to backend API
 * This route proxies requests to connect a user to an organizer via the backend API
 */

import { NextResponse } from 'next/server';
import axios from 'axios';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// PATCH connect organizer to user
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { firebaseUserId, appId = "1" } = await request.json();
    
    console.log(`Request to connect organizer ${id} to user ${firebaseUserId} with appId ${appId}`);
    
    // Validate required parameters
    if (!firebaseUserId) {
      return NextResponse.json({ 
        error: 'Firebase User ID is required'
      }, { status: 400 });
    }
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Organizer ID is required'
      }, { status: 400 });
    }
    
    // Prepare the request data
    const requestData = {
      firebaseUserId,
      appId
    };
    
    // Logging the API request
    console.log(`Proxying connect-user request to backend: ${BE_URL}/api/organizers/${id}/connect-user`);
    
    try {
      // Call the backend API to connect the user to the organizer
      const response = await axios.patch(`${BE_URL}/api/organizers/${id}/connect-user`, requestData);
      
      // Return success with the response data
      return NextResponse.json({
        message: 'User connected to organizer successfully',
        data: response.data
      });
    } catch (backendError) {
      console.error('Backend API error:', backendError.message);
      
      // Check if this is a connection error
      if (backendError.code === 'ECONNREFUSED') {
        return NextResponse.json(
          { 
            error: 'Could not connect to backend API',
            details: 'Please ensure the backend server is running' 
          },
          { status: 502 }
        );
      }
      
      // Check if the organizer or user is not found
      if (backendError.response?.status === 404) {
        return NextResponse.json(
          { 
            error: backendError.response.data?.message || 'Organizer or user not found'
          },
          { status: 404 }
        );
      }
      
      // Check if the user is already connected to another organizer
      if (backendError.response?.status === 409) {
        return NextResponse.json(
          { 
            error: backendError.response.data?.message || 'User is already connected to another organizer'
          },
          { status: 409 }
        );
      }
      
      // Forward any other backend error
      const status = backendError.response?.status || 500;
      const message = backendError.response?.data?.message || backendError.message || 'Error connecting user to organizer';
      
      return NextResponse.json(
        { error: message },
        { status }
      );
    }
  } catch (error) {
    console.error(`Error processing connect-user request for organizer ${params.id}:`, error.message);
    
    // Structured error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message || 'Unknown server error'
      },
      { status: 500 }
    );
  }
}