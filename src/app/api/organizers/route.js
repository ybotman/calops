import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    const isActive = searchParams.has('isActive') ? searchParams.get('isActive') : null;
    
    // Build the URL with proper query parameters
    let url = `${BE_URL}/api/organizers/all?appId=${appId}`;
    
    // If isActive is provided, add it to the URL
    // Note: The backend expects a 'true' or 'false' string, not a boolean
    if (isActive !== null) {
      url += `&isActive=${isActive}`;
    }
    
    console.log('Fetching organizers with URL:', url);
    const response = await axios.get(url);
    
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
    
    // Check for required fields
    if (!data.fullName && !data.name) {
      return NextResponse.json({
        error: 'Organizer name is required',
        field: 'fullName/name'
      }, { status: 400 });
    }
    
    if (!data.shortName) {
      return NextResponse.json({
        error: 'Short name is required',
        field: 'shortName'
      }, { status: 400 });
    }
    
    try {
      // Generate a temporary firebaseUserId
      const tempFirebaseUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Try creating a temporary user with our custom endpoint first
      let linkedUserLogin;
      
      try {
        // Create a temporary user first to get a valid user ID for linkedUserLogin
        const userResponse = await axios.post(`${BE_URL}/api/userlogins`, {
          firebaseUserId: tempFirebaseUserId,
          firstName: data.name || data.fullName || "Temporary",
          lastName: "User",
          appId: data.appId
        });
        
        console.log("Created temporary user:", userResponse.data);
        
        // Extract the user ID (MongoDB ObjectId) from the response
        linkedUserLogin = userResponse.data._id;
      } catch (userError) {
        console.error("Error creating temporary user:", userError);
        
        // Try using direct MongoDB connection as fallback
        try {
          const mongoose = require('mongoose');
          const connectToDatabase = require('@/lib/mongodb').default;
          
          // Connect to the database
          await connectToDatabase();
          
          // Define UserLogin model
          const UserLoginSchema = new mongoose.Schema({
            firebaseUserId: { type: String, required: true },
            appId: { type: String, required: true, default: "1" },
            active: { type: Boolean, default: true },
            localUserInfo: {
              firstName: { type: String },
              lastName: { type: String },
              isActive: { type: Boolean, default: true }
            },
            roleIds: [{ type: mongoose.Schema.Types.ObjectId }]
          }, { collection: 'userLogins' });
          
          // Create or get model
          const UserLogin = mongoose.models.UserLogin || mongoose.model('UserLogin', UserLoginSchema);
          
          // Create the temporary user
          const newUser = new UserLogin({
            firebaseUserId: tempFirebaseUserId,
            appId: data.appId,
            active: true,
            localUserInfo: {
              firstName: data.name || data.fullName || "Temporary",
              lastName: "User",
              isActive: true
            },
            roleIds: []
          });
          
          const savedUser = await newUser.save();
          linkedUserLogin = savedUser._id;
          
          console.log("Created temporary user via direct MongoDB connection:", savedUser._id);
        } catch (dbError) {
          console.error("Error creating user via direct MongoDB connection:", dbError);
          throw new Error("Failed to create temporary user for organizer");
        }
      }
      
      // Create organizer data with all required fields
      const organizerData = {
        appId: data.appId,
        firebaseUserId: tempFirebaseUserId,
        linkedUserLogin: linkedUserLogin, // Required field
        fullName: data.fullName || data.name,
        shortName: data.shortName,
        description: data.description || "",
        organizerRegion: data.organizerRegion || "66c4d99042ec462ea22484bd", // Default US region ID
        isActive: data.isActive !== undefined ? data.isActive : true,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        wantRender: data.wantRender !== undefined ? data.wantRender : true,
        organizerTypes: {
          isEventOrganizer: true,
          isVenue: false,
          isTeacher: false,
          isMaestro: false,
          isDJ: false,
          isOrchestra: false,
          ...(data.organizerTypes || {})
        },
        publicContactInfo: {
          Email: data.contactInfo?.email || data.email || '',
          phone: data.contactInfo?.phone || data.phone || '',
          url: data.contactInfo?.website || data.website || ''
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
    } catch (createError) {
      console.error('Error during organizer creation:', createError);
      
      // Try fallback to direct MongoDB creation
      try {
        console.log('Attempting direct MongoDB creation as fallback...');
        const mongoose = require('mongoose');
        const connectToDatabase = require('@/lib/mongodb').default;
        
        // Connect to the database
        await connectToDatabase();
        
        // Define minimal Organizer schema
        const OrganizerSchema = new mongoose.Schema({
          appId: { type: String, required: true, default: "1" },
          linkedUserLogin: { type: mongoose.Schema.Types.ObjectId, required: true },
          firebaseUserId: { type: String, required: true },
          fullName: { type: String, required: true },
          shortName: { type: String, required: true },
          organizerRegion: { type: mongoose.Schema.Types.ObjectId, required: true },
          isActive: { type: Boolean, default: true },
          isEnabled: { type: Boolean, default: true },
          wantRender: { type: Boolean, default: true },
          organizerTypes: {
            isEventOrganizer: { type: Boolean, default: true },
            isVenue: { type: Boolean, default: false },
            isTeacher: { type: Boolean, default: false },
            isMaestro: { type: Boolean, default: false },
            isDJ: { type: Boolean, default: false },
            isOrchestra: { type: Boolean, default: false }
          }
        }, { collection: 'organizers', strict: false });
        
        // Create or get model
        const Organizer = mongoose.models.Organizer || mongoose.model('Organizer', OrganizerSchema);
        
        // Generate temp ID if needed
        const tempFirebaseUserId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        // Create temporary user first
        const UserLoginSchema = new mongoose.Schema({
          firebaseUserId: { type: String, required: true },
          appId: { type: String, required: true, default: "1" },
          active: { type: Boolean, default: true },
          localUserInfo: {
            firstName: { type: String },
            lastName: { type: String }
          }
        }, { collection: 'userLogins', strict: false });
        
        const UserLogin = mongoose.models.UserLogin || mongoose.model('UserLogin', UserLoginSchema);
        
        const newUser = new UserLogin({
          firebaseUserId: tempFirebaseUserId,
          appId: data.appId,
          active: true,
          localUserInfo: {
            firstName: data.name || data.fullName || "Temporary",
            lastName: "User"
          }
        });
        
        const savedUser = await newUser.save();
        
        // Create the organizer with required fields
        const newOrganizer = new Organizer({
          appId: data.appId,
          firebaseUserId: tempFirebaseUserId,
          linkedUserLogin: savedUser._id,
          fullName: data.fullName || data.name,
          shortName: data.shortName,
          description: data.description || "",
          organizerRegion: new mongoose.Types.ObjectId(data.organizerRegion || "66c4d99042ec462ea22484bd"),
          isActive: data.isActive !== undefined ? data.isActive : true,
          isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
          wantRender: data.wantRender !== undefined ? data.wantRender : true,
          organizerTypes: {
            isEventOrganizer: true,
            isVenue: false,
            isTeacher: false,
            isMaestro: false,
            isDJ: false,
            isOrchestra: false
          }
        });
        
        const savedOrganizer = await newOrganizer.save();
        
        console.log('Organizer created via direct MongoDB:', savedOrganizer._id);
        
        return NextResponse.json(
          { 
            message: 'Organizer created successfully via direct database access', 
            organizer: savedOrganizer.toObject() 
          },
          { status: 201 }
        );
      } catch (directDbError) {
        console.error('Direct MongoDB creation failed:', directDbError);
        throw createError; // Re-throw the original error
      }
    }
  } catch (error) {
    console.error('Error creating organizer:', error);
    const errorDetails = error.response?.data || error.message;
    console.error('Error details:', errorDetails);
    
    return NextResponse.json({ 
      error: 'Failed to create organizer',
      details: JSON.stringify(errorDetails),
      message: typeof errorDetails === 'string' ? errorDetails : 'Unknown error occurred'
    }, { status: error.response?.status || 500 });
  }
}