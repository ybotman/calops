import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { MasteredCountry, MasteredRegion, MasteredDivision, MasteredCity } from '@/models/Location';

// Get model based on location type
function getModelForType(type) {
  switch (type) {
    case 'country': return MasteredCountry;
    case 'region': return MasteredRegion;
    case 'division': return MasteredDivision;
    case 'city': return MasteredCity;
    default: throw new Error(`Invalid location type: ${type}`);
  }
}

// GET location by type and ID
export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { type, id } = params;
    const Model = getModelForType(type);
    
    let location;
    
    // Fetch with appropriate population based on type
    switch (type) {
      case 'country':
        location = await Model.findById(id);
        break;
      case 'region':
        location = await Model.findById(id).populate('masteredCountryId');
        break;
      case 'division':
        location = await Model.findById(id)
          .populate({
            path: 'masteredRegionId',
            populate: { path: 'masteredCountryId' }
          });
        break;
      case 'city':
        location = await Model.findById(id)
          .populate({
            path: 'masteredDivisionId',
            populate: {
              path: 'masteredRegionId',
              populate: { path: 'masteredCountryId' }
            }
          });
        break;
    }
    
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json(location);
  } catch (error) {
    console.error(`Error fetching ${params.type} ${params.id}:`, error);
    return NextResponse.json({ error: `Failed to fetch ${params.type}` }, { status: 500 });
  }
}

// PATCH update location by type and ID
export async function PATCH(request, { params }) {
  try {
    await connectToDatabase();
    
    const { type, id } = params;
    const Model = getModelForType(type);
    const updates = await request.json();
    
    // Find and update the location
    const location = await Model.findById(id);
    
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    // Update fields
    Object.keys(updates).forEach(key => {
      location[key] = updates[key];
    });
    
    await location.save();
    
    // Return updated location with populated fields
    let updatedLocation;
    
    switch (type) {
      case 'country':
        updatedLocation = await Model.findById(id);
        break;
      case 'region':
        updatedLocation = await Model.findById(id).populate('masteredCountryId');
        break;
      case 'division':
        updatedLocation = await Model.findById(id)
          .populate({
            path: 'masteredRegionId',
            populate: { path: 'masteredCountryId' }
          });
        break;
      case 'city':
        updatedLocation = await Model.findById(id)
          .populate({
            path: 'masteredDivisionId',
            populate: {
              path: 'masteredRegionId',
              populate: { path: 'masteredCountryId' }
            }
          });
        break;
    }
    
    return NextResponse.json(updatedLocation);
  } catch (error) {
    console.error(`Error updating ${params.type} ${params.id}:`, error);
    return NextResponse.json({ error: `Failed to update ${params.type}` }, { status: 500 });
  }
}

// DELETE (or deactivate) location by type and ID
export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const { type, id } = params;
    const Model = getModelForType(type);
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hardDelete') === 'true';
    
    const location = await Model.findById(id);
    
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }
    
    if (hardDelete) {
      // Hard delete - remove from database
      await Model.findByIdAndDelete(id);
      return NextResponse.json({ message: `${type} deleted successfully` });
    } else {
      // Soft delete - set active to false
      location.active = false;
      await location.save();
      return NextResponse.json({ message: `${type} deactivated successfully` });
    }
  } catch (error) {
    console.error(`Error deleting ${params.type} ${params.id}:`, error);
    return NextResponse.json({ error: `Failed to delete ${params.type}` }, { status: 500 });
  }
}