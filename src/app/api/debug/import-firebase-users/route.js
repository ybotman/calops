import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

// Function to get a MongoDB model for UserLogins
async function getUserLoginModel() {
  await connectToDatabase();
  
  try {
    // Return existing model if it's already defined
    return mongoose.model('UserLogin');
  } catch (e) {
    // If model doesn't exist, define it with a minimal schema
    const schema = new mongoose.Schema({
      firebaseUserId: String,
      appId: String,
      active: Boolean,
      localUserInfo: {
        firstName: String,
        lastName: String,
        isActive: Boolean
      },
      roleIds: [mongoose.Schema.Types.ObjectId],
      regionalOrganizerInfo: {
        organizerId: mongoose.Schema.Types.ObjectId,
        isApproved: Boolean,
        isEnabled: Boolean,
        isActive: Boolean
      }
    }, { collection: 'userLogins', strict: false });
    
    return mongoose.model('UserLogin', schema);
  }
}

// Function to get a MongoDB model for Roles
async function getRoleModel() {
  await connectToDatabase();
  
  try {
    // Return existing model if it's already defined
    return mongoose.model('Role');
  } catch (e) {
    // If model doesn't exist, define it with a minimal schema
    const schema = new mongoose.Schema({
      roleName: String,
      appId: String,
      description: String
    }, { collection: 'roles', strict: false });
    
    return mongoose.model('Role', schema);
  }
}

// POST endpoint to import Firebase users into MongoDB
export async function POST(request) {
  try {
    // Parse the request body
    const { firebaseUsers, appId = '1' } = await request.json();
    
    // Validate input
    if (!firebaseUsers || !Array.isArray(firebaseUsers) || firebaseUsers.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'The firebaseUsers parameter is required and must be a non-empty array'
      }, { status: 400 });
    }
    
    console.log(`Importing ${firebaseUsers.length} Firebase users to userLogins collection...`);
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Get models
    const UserLogin = await getUserLoginModel();
    const Role = await getRoleModel();
    
    // Find the default user role
    const userRole = await Role.findOne({ roleName: 'User', appId });
    if (!userRole) {
      console.warn('User role not found, user will be created without roles');
    }
    
    // Statistics for tracking
    const stats = {
      total: firebaseUsers.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };
    
    // Process each Firebase user
    for (const fbUser of firebaseUsers) {
      try {
        // Extract the Firebase UID and basic info
        const { uid, email, displayName } = fbUser;
        
        if (!uid) {
          console.warn('Skipping user with no UID');
          stats.skipped++;
          stats.details.push({ uid: 'missing', reason: 'No UID provided' });
          continue;
        }
        
        // Parse the display name into first/last name
        let firstName = '';
        let lastName = '';
        
        if (displayName) {
          const nameParts = displayName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Check if user already exists
        const existingUser = await UserLogin.findOne({ firebaseUserId: uid, appId });
        
        if (existingUser) {
          // Update existing user
          existingUser.active = true;
          
          // Update name if it was empty
          if (!existingUser.localUserInfo?.firstName && firstName) {
            if (!existingUser.localUserInfo) existingUser.localUserInfo = {};
            existingUser.localUserInfo.firstName = firstName;
          }
          
          if (!existingUser.localUserInfo?.lastName && lastName) {
            if (!existingUser.localUserInfo) existingUser.localUserInfo = {};
            existingUser.localUserInfo.lastName = lastName;
          }
          
          // Add User role if not present
          if (userRole && (!existingUser.roleIds || existingUser.roleIds.length === 0)) {
            existingUser.roleIds = [userRole._id];
          }
          
          // Save updates
          await existingUser.save();
          stats.updated++;
          stats.details.push({ uid, action: 'updated', email });
        } else {
          // Create new user
          const newUser = new UserLogin({
            firebaseUserId: uid,
            appId,
            active: true,
            localUserInfo: {
              firstName,
              lastName,
              isActive: true
            },
            roleIds: userRole ? [userRole._id] : []
          });
          
          await newUser.save();
          stats.created++;
          stats.details.push({ uid, action: 'created', email });
        }
      } catch (userError) {
        console.error(`Error processing user:`, userError);
        stats.errors++;
        stats.details.push({ 
          uid: fbUser.uid || 'unknown', 
          action: 'error', 
          error: userError.message 
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error importing Firebase users:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// GET endpoint to check the status of userLogins vs Firebase UIDs
export async function GET(request) {
  try {
    // Get optional query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    
    // Connect to MongoDB
    await connectToDatabase();
    
    // Get UserLogin model
    const UserLogin = await getUserLoginModel();
    
    // Count users by type
    const totalUsers = await UserLogin.countDocuments({ appId });
    const tempUsers = await UserLogin.countDocuments({ 
      appId, 
      firebaseUserId: { $regex: '^temp_' } 
    });
    const realUsers = totalUsers - tempUsers;
    
    // Get sample of each type
    const realUsersSample = await UserLogin.find({ 
      appId,
      firebaseUserId: { $not: { $regex: '^temp_' } }
    }).limit(5).sort({ createdAt: -1 });
    
    const tempUsersSample = await UserLogin.find({ 
      appId,
      firebaseUserId: { $regex: '^temp_' }
    }).limit(5).sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        realUsers,
        tempUsers,
        realUsersSample: realUsersSample.map(u => ({
          id: u._id.toString(),
          firebaseUserId: u.firebaseUserId,
          name: `${u.localUserInfo?.firstName || ''} ${u.localUserInfo?.lastName || ''}`.trim(),
          active: u.active,
          isOrganizer: !!u.regionalOrganizerInfo?.organizerId
        })),
        tempUsersSample: tempUsersSample.map(u => ({
          id: u._id.toString(),
          firebaseUserId: u.firebaseUserId,
          name: `${u.localUserInfo?.firstName || ''} ${u.localUserInfo?.lastName || ''}`.trim(),
          active: u.active,
          isOrganizer: !!u.regionalOrganizerInfo?.organizerId
        }))
      }
    });
  } catch (error) {
    console.error('Error checking user stats:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}