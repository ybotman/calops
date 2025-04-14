import { NextResponse } from 'next/server';
import axios from 'axios';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { 
  getMasteredCountryModel, 
  getMasteredRegionModel, 
  getMasteredDivisionModel, 
  getMasteredCityModel 
} from '@/lib/models';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET() {
  try {
    // Check models directory
    const calendarBeModelsPath = process.env.CALENDAR_BE_MODELS_PATH || 
                               path.resolve('/Users/tobybalsley/MyDocs/AppDev/MasterCalendar/calendar-be/models');
    
    let modelPathExists = false;
    let modelFiles = [];
    
    try {
      modelPathExists = fs.existsSync(calendarBeModelsPath);
      if (modelPathExists) {
        modelFiles = fs.readdirSync(calendarBeModelsPath)
          .filter(file => file.endsWith('.js'));
      }
    } catch (e) {
      console.error('Error checking models path:', e);
    }
    
    // Connect to database
    let dbStatus = 'unknown';
    let mongooseStatus = {};
    
    try {
      await connectToDatabase();
      dbStatus = 'connected';
      
      // Check mongoose connection status
      mongooseStatus = {
        connected: mongoose.connection.readyState === 1,
        readyState: mongoose.connection.readyState,
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        readyStateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
        models: Object.keys(mongoose.models),
      };
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }
    
    // Test our models
    const modelsStatus = {};
    
    try {
      modelsStatus.MasteredCountry = { status: 'pending' };
      const countryModel = await getMasteredCountryModel();
      const countryCount = await countryModel.countDocuments();
      modelsStatus.MasteredCountry = { 
        status: 'success', 
        count: countryCount,
        modelName: countryModel.modelName 
      };
    } catch (e) {
      modelsStatus.MasteredCountry = { 
        status: 'error', 
        error: e.message 
      };
    }
    
    try {
      modelsStatus.MasteredRegion = { status: 'pending' };
      const regionModel = await getMasteredRegionModel();
      const regionCount = await regionModel.countDocuments();
      modelsStatus.MasteredRegion = { 
        status: 'success', 
        count: regionCount,
        modelName: regionModel.modelName 
      };
    } catch (e) {
      modelsStatus.MasteredRegion = { 
        status: 'error', 
        error: e.message 
      };
    }
    
    try {
      modelsStatus.MasteredDivision = { status: 'pending' };
      const divisionModel = await getMasteredDivisionModel();
      const divisionCount = await divisionModel.countDocuments();
      modelsStatus.MasteredDivision = { 
        status: 'success', 
        count: divisionCount,
        modelName: divisionModel.modelName 
      };
    } catch (e) {
      modelsStatus.MasteredDivision = { 
        status: 'error', 
        error: e.message 
      };
    }
    
    try {
      modelsStatus.MasteredCity = { status: 'pending' };
      const cityModel = await getMasteredCityModel();
      const cityCount = await cityModel.countDocuments();
      modelsStatus.MasteredCity = { 
        status: 'success', 
        count: cityCount,
        modelName: cityModel.modelName 
      };
    } catch (e) {
      modelsStatus.MasteredCity = { 
        status: 'error', 
        error: e.message 
      };
    }
    
    // Test backend connection with a health check
    let backendStatus = {};
    let apiTests = {};
    
    try {
      const response = await axios.get(`${BE_URL}/health`);
      backendStatus = {
        status: 'connected',
        data: response.data
      };
      
      // Test API calls
      const [rolesResponse, userResponse] = await Promise.all([
        axios.get(`${BE_URL}/api/roles?appId=1`).catch(e => ({ 
          status: e.response?.status || 500,
          error: e.message 
        })),
        axios.get(`${BE_URL}/api/userlogins/all?appId=1`).catch(e => ({ 
          status: e.response?.status || 500,
          error: e.message 
        }))
      ]);
      
      apiTests = {
        roles: rolesResponse.data ? {
          status: 'success',
          count: Array.isArray(rolesResponse.data) ? rolesResponse.data.length : 'unknown',
          sample: Array.isArray(rolesResponse.data) && rolesResponse.data.length > 0 
            ? rolesResponse.data[0] 
            : null
        } : {
          status: 'error',
          error: rolesResponse.error
        },
        users: userResponse.data ? {
          status: 'success',
          count: Array.isArray(userResponse.data) ? userResponse.data.length : 'unknown',
          sample: Array.isArray(userResponse.data) && userResponse.data.length > 0 
            ? {
                id: userResponse.data[0]._id,
                firebaseId: userResponse.data[0].firebaseUserId,
                name: `${userResponse.data[0].localUserInfo?.firstName || ''} ${userResponse.data[0].localUserInfo?.lastName || ''}`.trim(),
                roles: userResponse.data[0].roleIds?.length || 0
              } 
            : null
        } : {
          status: 'error',
          error: userResponse.error
        }
      };
    } catch (error) {
      console.error('Backend connection error:', error);
      backendStatus = {
        status: 'error',
        error: error.message
      };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        env: process.env.NODE_ENV
      },
      database: {
        status: dbStatus,
        mongooseStatus,
      },
      models: {
        path: calendarBeModelsPath,
        exists: modelPathExists,
        files: modelFiles,
        status: modelsStatus
      },
      backend: {
        url: BE_URL,
        status: backendStatus,
        apiTests
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      message: "Error getting debug information"
    }, { status: 500 });
  }
}