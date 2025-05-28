/**
 * Organizers API - Direct MongoDB access
 * This route provides direct access to organizers data using MongoDB
 */

import { NextResponse } from 'next/server';
import { getApiDatabase } from '@/lib/api-database';
import { getOrganizersModel } from '@/lib/models';

export async function GET(request) {
  try {
    // Connect to environment-aware database
    await getApiDatabase(request);
    
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    // Required parameters to validate
    if (!appId) {
      return NextResponse.json(
        { error: 'appId parameter is required' },
        { status: 400 }
      );
    }

    // Get organizers model and fetch data directly from MongoDB
    const Organizers = await getOrganizersModel();
    
    // Build query based on search parameters
    const query = { appId };
    
    // Add other filters from query parameters
    if (searchParams.get('active') !== null) {
      query.active = searchParams.get('active') === 'true';
    }
    
    console.log(`Fetching organizers from database with query:`, query);
    
    try {
      // Fetch organizers with timeout
      const organizers = await Promise.race([
        Organizers.find(query).sort({ createdAt: -1 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 10000)
        )
      ]);
      
      console.log(`Successfully fetched ${organizers.length} organizers from database`);
      
      // Return data in expected format
      return NextResponse.json({ organizers });
    } catch (dbError) {
      console.error('Database error:', dbError.message);
      
      // Check if this is a timeout error
      if (dbError.message === 'Database query timeout') {
        return NextResponse.json(
          { 
            error: 'Database request timed out',
            details: 'The database query took too long to respond' 
          },
          { status: 504 }
        );
      }
      
      // Return database error
      return NextResponse.json(
        { 
          error: 'Database error',
          details: dbError.message || 'Unknown database error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing organizers request:', error.message);
    
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

export async function POST(request) {
  try {
    // Connect to environment-aware database
    await getApiDatabase(request);
    
    const body = await request.json();
    const appId = body.appId || '1';
    
    // Validate request - check for required fields
    if (!body.fullName && !body.name) {
      return NextResponse.json({
        error: 'Organizer name is required',
        field: 'fullName/name'
      }, { status: 400 });
    }
    
    if (!body.shortName) {
      return NextResponse.json({
        error: 'Short name is required',
        field: 'shortName'
      }, { status: 400 });
    }
    
    // Prepare organizer data
    const organizerData = { 
      ...body, 
      appId,
      createdAt: new Date(),
      active: true
    };
    
    console.log(`Creating organizer in database:`, organizerData);
    
    try {
      // Get organizers model and create new organizer
      const Organizers = await getOrganizersModel();
      const newOrganizer = new Organizers(organizerData);
      const savedOrganizer = await newOrganizer.save();
      
      console.log('Organizer created successfully');
      return NextResponse.json(
        { message: 'Organizer created successfully', organizer: savedOrganizer },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('Database error during organizer creation:', dbError.message);
      
      // Handle validation errors
      if (dbError.name === 'ValidationError') {
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: dbError.message 
          },
          { status: 400 }
        );
      }
      
      // Handle duplicate key errors
      if (dbError.code === 11000) {
        return NextResponse.json(
          { 
            error: 'Organizer already exists',
            details: 'An organizer with this information already exists'
          },
          { status: 409 }
        );
      }
      
      // Return generic database error
      return NextResponse.json(
        { 
          error: 'Database error',
          details: dbError.message || 'Error creating organizer'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing organizer creation request:', error.message);
    
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