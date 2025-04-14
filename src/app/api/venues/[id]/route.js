import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

// Direct model definitions to avoid importing from calendar-be
let modelsCache = {};

// Venue model
async function getVenueModel() {
  if (modelsCache.Venue) {
    return modelsCache.Venue;
  }
  
  const Schema = mongoose.Schema;
  const venueSchema = new Schema({
    appId: { type: String, required: true, default: "1" },
    name: { type: String, default: "" },
    shortName: { type: String, default: "" },
    address1: { type: String, default: "" },
    address2: { type: String, default: "" },
    address3: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zip: { type: String, default: "" },
    phone: { type: String, default: "" },
    comments: { type: String, default: "" },
    latitude: { type: Number },
    longitude: { type: Number },
    geolocation: {
      type: { type: String, default: "Point", enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    masteredCityId: { type: Schema.Types.ObjectId, ref: "masteredCity" },
    masteredDivisionId: { type: Schema.Types.ObjectId, ref: "masteredDivision" },
    masteredRegionId: { type: Schema.Types.ObjectId, ref: "masteredRegion" },
    masteredCountryId: { type: Schema.Types.ObjectId, ref: "masteredCountry" },
    isActive: { type: Boolean, default: false },
  });
  
  venueSchema.index({ geolocation: "2dsphere" });
  
  const model = mongoose.models.venue || mongoose.model("venue", venueSchema);
  modelsCache.Venue = model;
  return model;
}

// MasteredCity model needed for geospatial queries
async function getMasteredCityModel() {
  if (modelsCache.MasteredCity) {
    return modelsCache.MasteredCity;
  }
  
  const Schema = mongoose.Schema;
  const masteredCitySchema = new Schema({
    appId: { type: String, required: true, default: "1" },
    cityName: { type: String, required: true },
    cityCode: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    location: {
      type: { type: String, enum: ["Point"], required: true, default: "Point" },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (value) {
            return value.length === 2;
          },
          message: "Coordinates must be [longitude, latitude]",
        },
      },
    },
    isActive: { type: Boolean, default: true },
    masteredDivisionId: {
      type: Schema.Types.ObjectId,
      ref: "masteredDivision",
      required: true,
    },
  });
  
  masteredCitySchema.index({ location: "2dsphere" });
  
  const model = mongoose.models.masteredCity || mongoose.model("masteredCity", masteredCitySchema);
  modelsCache.MasteredCity = model;
  return model;
}

// Helper function to find nearest city
async function findNearestCity(longitude, latitude) {
  try {
    const MasteredCity = await getMasteredCityModel();
    
    const nearestCity = await MasteredCity.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
        },
      },
      isActive: true,
    }).populate({
      path: 'masteredDivisionId',
      populate: {
        path: 'masteredRegionId',
        populate: { path: 'masteredCountryId' }
      }
    });
    
    return nearestCity;
  } catch (error) {
    console.error('Error finding nearest city:', error);
    return null;
  }
}

export async function GET(request, { params }) {
  try {
    console.log(`Fetching venue with ID: ${params.id}`);
    await connectToDatabase();
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid venue ID format' }, { status: 400 });
    }
    
    // Get Venue model
    const Venue = await getVenueModel();
    
    // Find venue by ID
    const venue = await Venue.findById(params.id).populate({
      path: 'masteredCityId',
      populate: {
        path: 'masteredDivisionId',
        populate: {
          path: 'masteredRegionId',
          populate: { path: 'masteredCountryId' }
        }
      }
    });
    
    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    return NextResponse.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch venue', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    console.log(`Updating venue with ID: ${params.id}`);
    await connectToDatabase();
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid venue ID format' }, { status: 400 });
    }
    
    // Get Venue model
    const Venue = await getVenueModel();
    
    // First check if the venue exists
    const existingVenue = await Venue.findById(params.id);
    if (!existingVenue) {
      console.error(`Venue with ID ${params.id} not found`);
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    console.log('Found existing venue:', existingVenue._id);
    
    // Parse request body
    let updateData;
    try {
      updateData = await request.json();
      console.log('Update data:', JSON.stringify(updateData, null, 2));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse request body', 
        details: parseError.message 
      }, { status: 400 });
    }
    
    // Check for required fields
    if (!updateData.name) {
      return NextResponse.json({ error: 'Venue name is required' }, { status: 400 });
    }
    
    // Sanitize ObjectId fields to ensure they're proper ObjectIds
    ['masteredCityId', 'masteredDivisionId', 'masteredRegionId', 'masteredCountryId'].forEach(field => {
      if (updateData[field]) {
        if (mongoose.Types.ObjectId.isValid(updateData[field])) {
          // Convert string ID to ObjectId
          updateData[field] = new mongoose.Types.ObjectId(updateData[field]);
        } else if (updateData[field] === '') {
          // If empty string, set to null
          updateData[field] = null;
        } else {
          console.warn(`Invalid ObjectId for ${field}: ${updateData[field]}, setting to null`);
          updateData[field] = null;
        }
      }
    });
    
    // Handle geolocation
    if (updateData.latitude && updateData.longitude) {
      updateData.geolocation = {
        type: "Point",
        coordinates: [parseFloat(updateData.longitude), parseFloat(updateData.latitude)]
      };
      
      // If masteredCityId is not provided but coordinates changed, find the nearest city
      if (!updateData.masteredCityId || updateData.findNearestCity) {
        console.log('Finding nearest city for updated coordinates');
        const nearestCity = await findNearestCity(updateData.longitude, updateData.latitude);
        
        if (nearestCity) {
          console.log('Nearest city found:', nearestCity.cityName);
          updateData.masteredCityId = nearestCity._id;
          updateData.masteredDivisionId = nearestCity.masteredDivisionId?._id;
          updateData.masteredRegionId = nearestCity.masteredDivisionId?.masteredRegionId?._id;
          updateData.masteredCountryId = nearestCity.masteredDivisionId?.masteredRegionId?.masteredCountryId?._id;
        }
      }
      
      // Remove the findNearestCity flag if it exists
      if (updateData.findNearestCity) {
        delete updateData.findNearestCity;
      }
    }
    
    console.log('Performing update with data:', JSON.stringify(updateData, null, 2));
    
    // Ensure numeric values are properly typed
    if (typeof updateData.latitude === 'string') updateData.latitude = parseFloat(updateData.latitude) || null;
    if (typeof updateData.longitude === 'string') updateData.longitude = parseFloat(updateData.longitude) || null;
    
    // Update venue - using findOneAndUpdate for more control
    const updatedVenue = await Venue.findOneAndUpdate(
      { _id: params.id }, // Query by _id
      { $set: updateData }, // Use $set to only update provided fields
      { 
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
        lean: true // Return a plain JavaScript object instead of a Mongoose document
      }
    );
    
    if (!updatedVenue) {
      console.error('Failed to update venue - not found in second check');
      return NextResponse.json({ error: 'Venue not found during update' }, { status: 404 });
    }
    
    console.log('Venue updated successfully');
    
    // Return simple object without trying to populate (which can cause errors)
    return NextResponse.json({
      message: 'Venue updated successfully',
      venue: updatedVenue
    });
  } catch (error) {
    console.error('Error updating venue:', error);
    console.error('Error stack:', error.stack);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return NextResponse.json({
        error: 'Validation error',
        validationErrors
      }, { status: 400 });
    }
    
    // Handle Cast errors (often from invalid ObjectId)
    if (error.name === 'CastError') {
      return NextResponse.json({
        error: 'Data format error',
        details: `Cannot convert ${error.path} value: ${error.value} to ${error.kind}`,
        message: error.message
      }, { status: 400 });
    }
    
    // Enhanced error info
    return NextResponse.json({ 
      error: 'Failed to update venue', 
      name: error.name,
      code: error.code,
      details: error.message,
      venue_id: params.id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    console.log(`Deleting venue with ID: ${params.id}`);
    await connectToDatabase();
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'Invalid venue ID format' }, { status: 400 });
    }
    
    // Get Venue model
    const Venue = await getVenueModel();
    
    // Find and delete venue
    const deletedVenue = await Venue.findByIdAndDelete(params.id);
    
    if (!deletedVenue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }
    
    console.log('Venue deleted successfully');
    return NextResponse.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return NextResponse.json({ 
      error: 'Failed to delete venue', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}