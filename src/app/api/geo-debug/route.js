import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

// Direct model definitions to avoid importing from calendar-be
let modelsCache = {};

// Helper functions for getting models
async function getMasteredCountryModel() {
  if (modelsCache.MasteredCountry) {
    return modelsCache.MasteredCountry;
  }
  
  const Schema = mongoose.Schema;
  const masteredCountrySchema = new Schema({
    appId: { type: String, required: true, default: "1" },
    countryName: { type: String, required: true },
    countryCode: { type: String, required: true },
    continent: { type: String, required: true },
    active: { type: Boolean, default: true },
  });
  
  const model = mongoose.models.masteredCountry || mongoose.model("masteredCountry", masteredCountrySchema);
  modelsCache.MasteredCountry = model;
  return model;
}

async function getMasteredRegionModel() {
  if (modelsCache.MasteredRegion) {
    return modelsCache.MasteredRegion;
  }
  
  const Schema = mongoose.Schema;
  const masteredRegionSchema = new Schema({
    appId: { type: String, required: true, default: "1" },
    regionName: { type: String, required: true },
    regionCode: { type: String, required: true },
    active: { type: Boolean, default: true },
    masteredCountryId: {
      type: Schema.Types.ObjectId,
      ref: "masteredCountry",
      required: true,
    },
  });
  
  const model = mongoose.models.masteredRegion || mongoose.model("masteredRegion", masteredRegionSchema);
  modelsCache.MasteredRegion = model;
  return model;
}

async function getMasteredDivisionModel() {
  if (modelsCache.MasteredDivision) {
    return modelsCache.MasteredDivision;
  }
  
  const Schema = mongoose.Schema;
  const masteredDivisionSchema = new Schema({
    appId: { type: String, required: true, default: "1" },
    divisionName: { type: String, required: true },
    divisionCode: { type: String, required: true },
    active: { type: Boolean, default: true },
    masteredRegionId: {
      type: Schema.Types.ObjectId,
      ref: "masteredRegion",
      required: true,
    },
    states: { type: [String], required: true },
  });
  
  const model = mongoose.models.masteredDivision || mongoose.model("masteredDivision", masteredDivisionSchema);
  modelsCache.MasteredDivision = model;
  return model;
}

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
  
  // Create 2dsphere index for geospatial queries
  masteredCitySchema.index({ location: "2dsphere" });
  
  const model = mongoose.models.masteredCity || mongoose.model("masteredCity", masteredCitySchema);
  modelsCache.MasteredCity = model;
  return model;
}

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