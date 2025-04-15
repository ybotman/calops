import { NextResponse } from 'next/server';
import axios from 'axios';
import mongoose from 'mongoose';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3003';

/**
 * Special endpoint for creating organizers
 * Uses a more direct approach to create an organizer without requiring a user
 */
export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Creating organizer with data:', JSON.stringify(data, null, 2));
    
    // Prepare the organizer data for the backend
    const organizerData = {
      fullName: data.fullName || data.name || '',
      name: data.name || data.fullName || '',
      shortName: data.shortName || '',
      description: data.description || '',
      appId: data.appId || '1',
      // Organizer types
      organizerTypes: {
        isEventOrganizer: data.organizerTypes?.isEventOrganizer === false ? false : true,
        isTeacher: data.organizerTypes?.isTeacher === true ? true : false,
        isDJ: data.organizerTypes?.isDJ === true ? true : false,
        isOrchestra: data.organizerTypes?.isOrchestra === true ? true : false
      },
      // Contact information
      publicContactInfo: {
        phone: data.publicContactInfo?.phone || '',
        email: data.publicContactInfo?.email || '',
        url: data.publicContactInfo?.url || ''
      },
      // Other attributes
      isActive: data.isActive === false ? false : true,
      isEnabled: data.isEnabled === false ? false : true,
      isRendered: data.isRendered === false ? false : true,
      wantRender: data.wantRender === false ? false : true,
      isActiveAsOrganizer: data.isActiveAsOrganizer === true ? true : false,
      // External IDs
      btcNiceName: data.btcNiceName || ''
    };
    
    // Add images if they exist
    if (data.images && data.images.originalUrl) {
      organizerData.images = {
        originalUrl: data.images.originalUrl
      };
    }
    
    console.log('Sending organizer creation request with data:', organizerData);
    
    try {
      // Create organizer directly
      const organizerResponse = await axios.post(`${BE_URL}/api/organizers`, organizerData);
      console.log('Organizer creation response status:', organizerResponse.status);
      console.log('Organizer creation response data:', organizerResponse.data);
      
      if (!organizerResponse.data) {
        return NextResponse.json({
          error: 'Failed to create organizer properly',
          details: 'Organizer creation did not return valid data'
        }, { status: 500 });
      }
      
      return NextResponse.json({
        message: 'Organizer created successfully',
        organizer: organizerResponse.data
      }, { status: 201 });
      
    } catch (orgError) {
      console.error('Error creating organizer:', orgError);
      let errorDetails = 'Unknown error in organizer creation';
      
      if (orgError.response) {
        console.error('Organizer creation response data:', orgError.response.data);
        errorDetails = orgError.response.data;
      } else {
        errorDetails = orgError.message;
      }
      
      return NextResponse.json({
        error: 'Failed to create organizer',
        details: errorDetails
      }, { status: orgError.response?.status || 500 });
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
      error: 'Failed in the organizer creation process',
      details: errorDetails
    }, { status: error.response?.status || 500 });
  }
}