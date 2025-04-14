import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { 
  getMasteredCountryModel, 
  getMasteredRegionModel, 
  getMasteredDivisionModel, 
  getMasteredCityModel
} from '@/lib/models';
import mongoose from 'mongoose';

// Helper function to get the correct model
async function getModelForType(type) {
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
      throw new Error('Invalid geo hierarchy type');
  }
}

export async function GET(request, { params }) {
  try {
    console.log(`Fetching ${params.type} with ID: ${params.id}`);
    await connectToDatabase();
    
    const { type, id } = params;
    
    // Validate type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid geo hierarchy ID format' }, { status: 400 });
    }
    
    try {
      const Model = await getModelForType(type);
      
      let item;
      
      // Get the geo hierarchy item with populated references
      switch (type) {
        case 'country':
          item = await Model.findById(id);
          break;
        case 'region':
          item = await Model.findById(id).populate('masteredCountryId');
          break;
        case 'division':
          item = await Model.findById(id).populate({
            path: 'masteredRegionId',
            populate: { path: 'masteredCountryId' }
          });
          break;
        case 'city':
          item = await Model.findById(id).populate({
            path: 'masteredDivisionId',
            populate: {
              path: 'masteredRegionId',
              populate: { path: 'masteredCountryId' }
            }
          });
          break;
      }
      
      if (!item) {
        return NextResponse.json({ error: `${type} not found` }, { status: 404 });
      }
      
      // Force appId to "1"
      if (item.appId !== "1") {
        item.appId = "1";
      }
      
      return NextResponse.json(item);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return NextResponse.json({ 
        error: `Failed to fetch ${type}`, 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in geo hierarchy GET route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    console.log(`Updating ${params.type} with ID: ${params.id}`);
    await connectToDatabase();
    
    const { type, id } = params;
    
    // Validate type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid geo hierarchy ID format' }, { status: 400 });
    }
    
    // Get the update data
    const updateData = await request.json();
    console.log(`Update data for ${type}:`, JSON.stringify(updateData));
    
    // Always ensure appId is set to "1"
    updateData.appId = "1";
    
    try {
      const Model = await getModelForType(type);
      
      // Update the geo hierarchy item
      const updatedItem = await Model.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!updatedItem) {
        return NextResponse.json({ error: `${type} not found` }, { status: 404 });
      }
      
      console.log(`Successfully updated ${type} with ID ${id}`);
      return NextResponse.json({
        message: `${type} updated successfully`,
        item: updatedItem
      });
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      
      // Provide more detailed error messages for validation errors
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
      
      return NextResponse.json({ 
        error: `Failed to update ${type}`, 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in geo hierarchy PUT route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    console.log(`Deleting ${params.type} with ID: ${params.id}`);
    await connectToDatabase();
    
    const { type, id } = params;
    
    // Validate type
    if (!['country', 'region', 'division', 'city'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid geo hierarchy type. Must be one of: country, region, division, city' },
        { status: 400 }
      );
    }
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid geo hierarchy ID format' }, { status: 400 });
    }
    
    try {
      // Check for dependencies before deleting
      let hasDependencies = false;
      let dependencyMessage = '';
      
      switch (type) {
        case 'country':
          // Check if any regions reference this country
          const MasteredRegion = await getMasteredRegionModel();
          const regionsUsingCountry = await MasteredRegion.countDocuments({ masteredCountryId: id });
          
          if (regionsUsingCountry > 0) {
            hasDependencies = true;
            dependencyMessage = `Cannot delete country: ${regionsUsingCountry} region(s) are associated with this country.`;
          }
          break;
          
        case 'region':
          // Check if any divisions reference this region
          const MasteredDivision = await getMasteredDivisionModel();
          const divisionsUsingRegion = await MasteredDivision.countDocuments({ masteredRegionId: id });
          
          if (divisionsUsingRegion > 0) {
            hasDependencies = true;
            dependencyMessage = `Cannot delete region: ${divisionsUsingRegion} division(s) are associated with this region.`;
          }
          break;
          
        case 'division':
          // Check if any cities reference this division
          const MasteredCity = await getMasteredCityModel();
          const citiesUsingDivision = await MasteredCity.countDocuments({ masteredDivisionId: id });
          
          if (citiesUsingDivision > 0) {
            hasDependencies = true;
            dependencyMessage = `Cannot delete division: ${citiesUsingDivision} city/cities are associated with this division.`;
          }
          break;
          
        // Cities don't need dependency check as they don't have child entities in this schema
      }
      
      if (hasDependencies) {
        return NextResponse.json({ error: dependencyMessage }, { status: 400 });
      }
      
      const Model = await getModelForType(type);
      const result = await Model.findByIdAndDelete(id);
      
      if (!result) {
        return NextResponse.json({ error: `${type} with ID ${id} not found` }, { status: 404 });
      }
      
      console.log(`Successfully deleted ${type} with ID ${id}`);
      return NextResponse.json({ message: `${type} deleted successfully` });
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      return NextResponse.json({ 
        error: `Failed to delete ${type}`, 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in geo hierarchy DELETE route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}