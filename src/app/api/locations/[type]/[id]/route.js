import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { 
  getMasteredCountryModel, 
  getMasteredRegionModel, 
  getMasteredDivisionModel, 
  getMasteredCityModel
} from '@/lib/models';

async function getModelByType(type) {
  switch (type) {
    case 'country':
      return await getMasteredCountryModel();
    case 'region':
      return await getMasteredRegionModel();
    case 'division':
      return await getMasteredDivisionModel();
    case 'city':
      return await getMasteredCityModel();
    default:
      throw new Error(`Invalid location type: ${type}`);
  }
}

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    
    const { type, id } = params;
    
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing location type or ID' }, { status: 400 });
    }
    
    const Model = await getModelByType(type);
    let location;
    
    switch (type) {
      case 'country':
        location = await Model.findById(id);
        break;
      case 'region':
        location = await Model.findById(id).populate('masteredCountryId');
        break;
      case 'division':
        location = await Model.findById(id).populate({
          path: 'masteredRegionId',
          populate: { path: 'masteredCountryId' }
        });
        break;
      case 'city':
        location = await Model.findById(id).populate({
          path: 'masteredDivisionId',
          populate: {
            path: 'masteredRegionId',
            populate: { path: 'masteredCountryId' }
          }
        });
        break;
    }
    
    if (!location) {
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }
    
    // Force appId to "1" for all responses
    if (location.appId !== "1") {
      location.appId = "1";
    }
    
    return NextResponse.json(location);
  } catch (error) {
    console.error(`Error fetching ${params.type}:`, error);
    return NextResponse.json({ error: `Failed to fetch ${params.type}` }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    
    const { type, id } = params;
    
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing location type or ID' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Always set appId to "1" regardless of what's provided
    data.appId = "1";
    
    const Model = await getModelByType(type);
    const location = await Model.findById(id);
    
    if (!location) {
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }
    
    // Update the location
    Object.keys(data).forEach(key => {
      location[key] = data[key];
    });
    
    await location.save();
    
    return NextResponse.json({ message: `${type} updated successfully`, location });
  } catch (error) {
    console.error(`Error updating ${params.type}:`, error);
    return NextResponse.json({ error: `Failed to update ${params.type}` }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDatabase();
    
    const { type, id } = params;
    
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing location type or ID' }, { status: 400 });
    }
    
    const Model = await getModelByType(type);
    const result = await Model.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json({ error: `${type} not found` }, { status: 404 });
    }
    
    return NextResponse.json({ message: `${type} deleted successfully` });
  } catch (error) {
    console.error(`Error deleting ${params.type}:`, error);
    return NextResponse.json({ error: `Failed to delete ${params.type}` }, { status: 500 });
  }
}
