import { NextResponse } from 'next/server';
import axios from 'axios';
import { getOrganizersModel } from '@/lib/models';
import { getUserLoginsModel } from '@/lib/models';
import connectToDatabase from '@/lib/mongodb';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

// PATCH connect organizer to user
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { firebaseUserId, appId = "1" } = await request.json();
    
    if (!firebaseUserId) {
      return NextResponse.json({ 
        error: 'Firebase User ID is required'
      }, { status: 400 });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Get models
    const Organizers = await getOrganizersModel();
    const UserLogins = await getUserLoginsModel();
    
    // Find the organizer
    const organizer = await Organizers.findOne({ _id: id, appId });
    if (!organizer) {
      return NextResponse.json({ error: 'Organizer not found' }, { status: 404 });
    }
    
    // Find the user
    const user = await UserLogins.findOne({ firebaseUserId, appId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update the user's regionalOrganizerInfo
    user.regionalOrganizerInfo = {
      ...user.regionalOrganizerInfo,
      organizerId: organizer._id,
      isApproved: true,
      isEnabled: true,
      isActive: true,
      ApprovalDate: new Date()
    };
    
    // Check if user has the RegionalOrganizer role and add it if not
    const rolesResponse = await axios.get(`${BE_URL}/api/roles?appId=${appId}`);
    const roles = rolesResponse.data;
    const organizerRole = roles.find(role => role.roleName === 'RegionalOrganizer');
    
    if (organizerRole && !user.roleIds.some(r => r.toString() === organizerRole._id.toString())) {
      user.roleIds.push(organizerRole._id);
    }
    
    // Save the user updates
    await user.save();
    
    // Return success
    return NextResponse.json({
      message: 'User connected to organizer successfully',
      user: {
        firebaseUserId: user.firebaseUserId,
        regionalOrganizerInfo: user.regionalOrganizerInfo,
        roleIds: user.roleIds
      }
    });
  } catch (error) {
    console.error(`Error connecting user to organizer ${params.id}:`, error);
    return NextResponse.json({ 
      error: 'Failed to connect user to organizer',
      details: error.response?.data?.message || error.message
    }, { status: error.response?.status || 500 });
  }
}