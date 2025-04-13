import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    
    // Use the /all endpoint which doesn't require filters
    const response = await axios.get(`${BE_URL}/api/organizers/all?appId=${appId}`);
    
    console.log('Successful organizers fetch, count:', response.data.length);
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching organizers:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch organizers',
      details: error.response?.data?.message || error.message 
    }, { status: error.response?.status || 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Creating organizer with data:', JSON.stringify(data, null, 2));
    
    // Set default appId if not provided
    if (!data.appId) {
      data.appId = "1";
    }
    
    // Generate a temporary firebaseUserId
    const tempFirebaseUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Create a temporary user first to get a valid user ID for linkedUserLogin
    const userResponse = await axios.post(`${BE_URL}/api/userlogins`, {
      firebaseUserId: tempFirebaseUserId,
      firstName: data.name || "Temporary",
      lastName: "User",
      appId: data.appId
    });
    
    console.log("Created temporary user:", userResponse.data);
    
    // Extract the user ID (MongoDB ObjectId) from the response
    const linkedUserLogin = userResponse.data._id;
    
    // Create simplified mock organizer data with all required fields
    const organizerData = {
      appId: data.appId,
      firebaseUserId: tempFirebaseUserId,
      linkedUserLogin: linkedUserLogin, // Required field
      fullName: data.fullName || data.name,
      shortName: data.shortName,
      description: data.description,
      organizerRegion: "66c4d99042ec462ea22484bd", // Default US region ID
      isActive: data.isActive,
      isEnabled: data.isEnabled,
      wantRender: true,
      organizerTypes: {
        isEventOrganizer: true,
        isVenue: false,
        isTeacher: false,
        isMaestro: false,
        isDJ: false,
        isOrchestra: false
      },
      publicContactInfo: {
        Email: data.contactInfo?.email || '',
        phone: data.contactInfo?.phone || '',
        url: data.contactInfo?.website || ''
      }
    };
    
    console.log('Sending to backend:', JSON.stringify(organizerData, null, 2));
    
    // Call backend directly to create the organizer
    const response = await axios.post(`${BE_URL}/api/organizers`, organizerData);
    
    console.log('Organizer created successfully:', response.data);
    
    return NextResponse.json(
      { message: 'Organizer created successfully', organizer: response.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating organizer:', error);
    const errorDetails = error.response?.data || error.message;
    console.error('Error details:', errorDetails);
    
    return NextResponse.json({ 
      error: 'Failed to create organizer',
      details: JSON.stringify(errorDetails)
    }, { status: error.response?.status || 500 });
  }
}