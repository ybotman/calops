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
    await connectToDatabase();
    
    // Get models from calendar-be
    const MasteredCountry = await getMasteredCountryModel();
    const MasteredRegion = await getMasteredRegionModel();
    const MasteredDivision = await getMasteredDivisionModel();
    const MasteredCity = await getMasteredCityModel();
    
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
    await connectToDatabase();
    
    // Get models based on location type
    const data = await request.json();
    const { type, ...locationData } = data;
    
    // Always set appId to "1" regardless of what's provided
    locationData.appId = "1";
    
    let newLocation;
    let Model;
    
    // Create location based on the specified type
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
    
    await newLocation.save();
    
    return NextResponse.json(
      { message: `${type} created successfully`, location: newLocation },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}