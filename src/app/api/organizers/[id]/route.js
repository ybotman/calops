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
    
    console.log(`API: Updating organizer ${id} with appId ${appId}`);
    console.log(`API: Update data:`, JSON.stringify(updates, null, 2));
    
    // Explicitly validate that id is a valid string and not undefined or other
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error(`API: Invalid organizer ID: "${id}"`);
      return NextResponse.json({ 
        error: 'Invalid organizer ID',
        details: `ID must be a valid MongoDB ObjectId string, got: ${typeof id} ${id}`
      }, { status: 400 });
    }
    
    // Prepare the backend URL
    const updateUrl = `${BE_URL}/api/organizers/${id}?appId=${appId}`;
    console.log(`API: PUT request to: ${updateUrl}`);
    
    // Make sure all required fields are present
    const organizer = {
      ...updates,
      appId,
      _id: id, // Ensure _id is included
      fullName: updates.name || updates.fullName, // Make sure fullName is set if only name is provided
      organizerRegion: updates.organizerRegion || "66c4d99042ec462ea22484bd" // Default US region
    };
    
    // Forward request to backend
    try {
      const response = await axios.put(updateUrl, organizer);
      console.log('API: Update successful:', response.data);
      return NextResponse.json(response.data);
    } catch (backendError) {
      console.error(`API: Backend error:`, backendError);
      console.error(`API: Backend response:`, backendError.response?.data);
      
      // Try an alternative approach - sometimes the backend expects different endpoints
      if (backendError.response?.status === 404) {
        console.log(`API: 404 returned, trying alternate endpoint...`);
        try {
          // Try without trailing slash
          const altUrl = `${BE_URL}/api/organizers/${id}?appId=${appId}`;
          console.log(`API: Trying alternate URL: ${altUrl}`);
          const altResponse = await axios.put(altUrl, organizer);
          console.log('API: Alternate URL successful:', altResponse.data);
          return NextResponse.json(altResponse.data);
        } catch (altError) {
          console.error(`API: Alternative approach also failed:`, altError);
          throw altError; // Rethrow to be caught by outer catch
        }
      }
      
      throw backendError; // Rethrow to be caught by outer catch
    }
  } catch (error) {
    console.error(`API: Error updating organizer ${params.id}:`, error);
    let errorDetails = error.message;
    let statusCode = 500;
    
    if (error.response) {
      statusCode = error.response.status || 500;
      errorDetails = JSON.stringify(error.response.data || {});
      console.error(`API: Error status: ${statusCode}, details:`, errorDetails);
    }
    
    return NextResponse.json({ 
      error: 'Failed to update organizer',
      details: errorDetails
    }, { status: statusCode });
  }
}

// DELETE organizer by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    
    console.log(`Deleting organizer ${id} with appId ${appId}`);
    
    // Forward delete request to backend
    const response = await axios.delete(`${BE_URL}/api/organizers/${id}?appId=${appId}`);
    
    console.log('Delete successful');
    return NextResponse.json({ message: 'Organizer deleted successfully' });
  } catch (error) {
    console.error(`Error deleting organizer ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to delete organizer',
      details: error.response?.data?.message || error.message
    }, { status: error.response?.status || 500 });
  }
}