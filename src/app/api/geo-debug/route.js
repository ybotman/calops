import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import { 
  getMasteredCountryModel, 
  getMasteredRegionModel, 
  getMasteredDivisionModel, 
  getMasteredCityModel
} from '@/lib/models';

export async function GET() {
  try {
    // Environment information
    const env = {
      nodeEnv: process.env.NODE_ENV,
      mongodbUri: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 20)}...` : 'not set',
      mongodbUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
      calendarBeModelsPath: process.env.CALENDAR_BE_MODELS_PATH || 'default path'
    };
    
    // Database status
    let dbStatus = 'unknown';
    let mongoModels = [];
    
    try {
      await connectToDatabase();
      dbStatus = 'connected';
      mongoModels = Object.keys(mongoose.models);
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }
    
    // Test our models
    const modelsStatus = {};
    
    // Test countries model
    try {
      const MasteredCountry = await getMasteredCountryModel();
      const count = await MasteredCountry.countDocuments({ appId: "1" });
      modelsStatus.countries = {
        status: 'success',
        count,
        model: MasteredCountry.modelName
      };
    } catch (e) {
      modelsStatus.countries = {
        status: 'error',
        error: e.message
      };
    }
    
    // Test regions model
    try {
      const MasteredRegion = await getMasteredRegionModel();
      const count = await MasteredRegion.countDocuments({ appId: "1" });
      modelsStatus.regions = {
        status: 'success',
        count,
        model: MasteredRegion.modelName
      };
    } catch (e) {
      modelsStatus.regions = {
        status: 'error',
        error: e.message
      };
    }
    
    // Test divisions model
    try {
      const MasteredDivision = await getMasteredDivisionModel();
      const count = await MasteredDivision.countDocuments({ appId: "1" });
      modelsStatus.divisions = {
        status: 'success',
        count,
        model: MasteredDivision.modelName
      };
    } catch (e) {
      modelsStatus.divisions = {
        status: 'error',
        error: e.message
      };
    }
    
    // Test cities model
    try {
      const MasteredCity = await getMasteredCityModel();
      const count = await MasteredCity.countDocuments({ appId: "1" });
      modelsStatus.cities = {
        status: 'success',
        count,
        model: MasteredCity.modelName
      };
    } catch (e) {
      modelsStatus.cities = {
        status: 'error',
        error: e.message
      };
    }
    
    // Return the debug info
    return NextResponse.json({
      environment: env,
      database: {
        status: dbStatus,
        models: mongoModels,
      },
      models: modelsStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug info error:', error);
    return NextResponse.json({
      error: 'Failed to get debug info',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}