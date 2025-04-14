import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Environment information
    const env = {
      nodeEnv: process.env.NODE_ENV,
      mongodbUri: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 20)}...` : 'not set',
      mongodbUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
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
    
    // Check Venue model
    let venueModelInfo = {};
    try {
      // Try to define and access the venue model
      const Schema = mongoose.Schema;
      const venueSchema = new Schema({
        appId: { type: String, required: true, default: "1" },
        name: { type: String, default: "" },
        shortName: { type: String, default: "" },
        address1: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        isActive: { type: Boolean, default: false },
      });
      
      // Try to access or create model
      const model = mongoose.models.venue || mongoose.model("venue", venueSchema);
      
      venueModelInfo = {
        status: 'success',
        modelName: model.modelName,
        collection: model.collection.name,
      };
    } catch (e) {
      venueModelInfo = {
        status: 'error',
        error: e.message,
        stack: e.stack
      };
    }
    
    // Return the debug info
    return NextResponse.json({
      environment: env,
      database: {
        status: dbStatus,
        models: mongoModels,
      },
      venueModel: venueModelInfo,
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