import { NextResponse } from 'next/server';
import { getApiDatabase } from '@/lib/api-database';
import { getRolesModel } from '@/lib/models';

// GET handler - Get all roles for an app
export async function GET(request) {
  try {
    // Connect to environment-aware database
    await getApiDatabase(request);
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    
    // Get roles model and fetch data directly from MongoDB
    const Roles = await getRolesModel();
    const roles = await Roles.find({ appId }).sort({ roleName: 1 });
    
    console.log(`Successfully fetched ${roles.length} roles for appId: ${appId}`);
    
    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch roles',
      details: error.message
    }, { status: 500 });
  }
}