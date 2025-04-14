import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { 
  getMasteredCountryModel, 
  getMasteredRegionModel, 
  getMasteredDivisionModel, 
  getMasteredCityModel
} from '@/lib/models';

export async function GET(request) {
  try {
    console.log('Starting locations API request...');
    await connectToDatabase();
    console.log('Database connection established');
    
    // Get models from calendar-be
    console.log('Fetching models for locations API...');
    let MasteredCountry, MasteredRegion, MasteredDivision, MasteredCity;
    
    // Load all models in parallel using Promise.all
    try {
      [MasteredCountry, MasteredRegion, MasteredDivision, MasteredCity] = await Promise.all([
        getMasteredCountryModel(),
        getMasteredRegionModel(),
        getMasteredDivisionModel(),
        getMasteredCityModel()
      ]);
      
      console.log('Successfully loaded all location models');
    } catch (e) {
      console.error('Error loading location models:', e);
      
      // Try to load each model individually to provide more specific error messages
      try {
        MasteredCountry = await getMasteredCountryModel();
        console.log('Loaded MasteredCountry model');
      } catch (e) {
        console.error('Error loading MasteredCountry model:', e);
        return NextResponse.json({ 
          error: 'Failed to load MasteredCountry model', 
          details: e.message,
          stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        }, { status: 500 });
      }
      
      try {
        MasteredRegion = await getMasteredRegionModel();
        console.log('Loaded MasteredRegion model');
      } catch (e) {
        console.error('Error loading MasteredRegion model:', e);
        return NextResponse.json({ 
          error: 'Failed to load MasteredRegion model', 
          details: e.message,
          stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        }, { status: 500 });
      }
      
      try {
        MasteredDivision = await getMasteredDivisionModel();
        console.log('Loaded MasteredDivision model');
      } catch (e) {
        console.error('Error loading MasteredDivision model:', e);
        return NextResponse.json({ 
          error: 'Failed to load MasteredDivision model', 
          details: e.message,
          stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        }, { status: 500 });
      }
      
      try {
        MasteredCity = await getMasteredCityModel();
        console.log('Loaded MasteredCity model');
      } catch (e) {
        console.error('Error loading MasteredCity model:', e);
        return NextResponse.json({ 
          error: 'Failed to load MasteredCity model', 
          details: e.message,
          stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        }, { status: 500 });
      }
    }
    
    const { searchParams } = new URL(request.url);
    // Ensure appId is always "1" regardless of what's passed in the URL
    const appId = "1";
    const type = searchParams.get('type') || 'all'; // country, region, division, city, or all
    const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined;
    
    const query = { appId };
    if (active !== undefined) query.active = active;
    
    let result = {};
    
    // Fetch locations based on the requested type
    switch (type) {
      case 'country':
        result = await MasteredCountry.find(query).sort({ countryName: 1 });
        break;
      case 'region':
        result = await MasteredRegion.find(query)
          .populate('masteredCountryId')
          .sort({ regionName: 1 });
        break;
      case 'division':
        result = await MasteredDivision.find(query)
          .populate({
            path: 'masteredRegionId',
            populate: { path: 'masteredCountryId' }
          })
          .sort({ divisionName: 1 });
        break;
      case 'city':
        result = await MasteredCity.find(query)
          .populate({
            path: 'masteredDivisionId',
            populate: {
              path: 'masteredRegionId',
              populate: { path: 'masteredCountryId' }
            }
          })
          .sort({ cityName: 1 });
        break;
      case 'all':
      default:
        // Fetch all location types
        const countries = await MasteredCountry.find(query).sort({ countryName: 1 });
        const regions = await MasteredRegion.find(query)
          .populate('masteredCountryId')
          .sort({ regionName: 1 });
        const divisions = await MasteredDivision.find(query)
          .populate({
            path: 'masteredRegionId',
            populate: { path: 'masteredCountryId' }
          })
          .sort({ divisionName: 1 });
        const cities = await MasteredCity.find(query)
          .populate({
            path: 'masteredDivisionId',
            populate: {
              path: 'masteredRegionId',
              populate: { path: 'masteredCountryId' }
            }
          })
          .sort({ cityName: 1 });
        
        result = { countries, regions, divisions, cities };
        break;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('Starting POST request to create a location...');
    await connectToDatabase();
    console.log('Database connection established for POST');
    
    // Get models based on location type
    const data = await request.json();
    const { type, ...locationData } = data;
    
    // Validation
    if (!type) {
      return NextResponse.json(
        { error: 'Location type is required' },
        { status: 400 }
      );
    }
    
    console.log(`Creating ${type} with data:`, JSON.stringify(locationData));
    
    // Always set appId to "1" regardless of what's provided
    locationData.appId = "1";
    
    let newLocation;
    let Model;
    
    // Create location based on the specified type
    try {
      switch (type) {
        case 'country':
          Model = await getMasteredCountryModel();
          newLocation = new Model(locationData);
          break;
        case 'region':
          Model = await getMasteredRegionModel();
          newLocation = new Model(locationData);
          break;
        case 'division':
          Model = await getMasteredDivisionModel();
          newLocation = new Model(locationData);
          break;
        case 'city':
          Model = await getMasteredCityModel();
          newLocation = new Model(locationData);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid location type. Must be one of: country, region, division, city' },
            { status: 400 }
          );
      }
    } catch (modelError) {
      console.error(`Error loading model for type ${type}:`, modelError);
      return NextResponse.json({ 
        error: `Failed to load model for type ${type}`, 
        details: modelError.message,
        stack: process.env.NODE_ENV === 'development' ? modelError.stack : undefined
      }, { status: 500 });
    }
    
    try {
      await newLocation.save();
      console.log(`Successfully created ${type} with id ${newLocation._id}`);
    } catch (saveError) {
      console.error(`Error saving ${type}:`, saveError);
      
      // Provide more detailed error messages based on mongoose validation errors
      if (saveError.name === 'ValidationError') {
        const validationErrors = {};
        
        for (const field in saveError.errors) {
          validationErrors[field] = saveError.errors[field].message;
        }
        
        return NextResponse.json({
          error: 'Validation error',
          validationErrors
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: `Failed to save ${type}`, 
        details: saveError.message,
        stack: process.env.NODE_ENV === 'development' ? saveError.stack : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { message: `${type} created successfully`, location: newLocation },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ 
      error: 'Failed to create location', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    console.log('Starting DELETE request for a location...');
    await connectToDatabase();
    console.log('Database connection established for DELETE');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    
    // Validation
    if (!type || !id) {
      return NextResponse.json(
        { error: 'Location type and ID are required' },
        { status: 400 }
      );
    }
    
    console.log(`Deleting ${type} with ID: ${id}`);
    
    let Model;
    let deleteResult;
    
    // Get the appropriate model
    try {
      switch (type) {
        case 'country':
          Model = await getMasteredCountryModel();
          break;
        case 'region':
          Model = await getMasteredRegionModel();
          break;
        case 'division':
          Model = await getMasteredDivisionModel();
          break;
        case 'city':
          Model = await getMasteredCityModel();
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid location type. Must be one of: country, region, division, city' },
            { status: 400 }
          );
      }
    } catch (modelError) {
      console.error(`Error loading model for type ${type}:`, modelError);
      return NextResponse.json({ 
        error: `Failed to load model for type ${type}`, 
        details: modelError.message,
        stack: process.env.NODE_ENV === 'development' ? modelError.stack : undefined
      }, { status: 500 });
    }
    
    // Check dependency before deleting
    try {
      // Check if this location has dependencies
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
      
      // Proceed with deletion
      deleteResult = await Model.findByIdAndDelete(id);
      
      if (!deleteResult) {
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
    console.error('Error processing delete request:', error);
    return NextResponse.json({ 
      error: 'Failed to process delete request', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}