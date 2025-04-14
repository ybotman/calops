/**
 * Models bridge between calendar-admin and calendar-be
 * 
 * This file imports the models from calendar-be instead of redefining them,
 * ensuring that we're using the same schema definitions.
 */

import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import connectToDatabase from './mongodb';

// Path to the models directory in calendar-be
// First try from environment variable, then fallback to relative path
const calendarBeModelsPath = process.env.CALENDAR_BE_MODELS_PATH || 
                            path.resolve('/Users/tobybalsley/MyDocs/AppDev/MasterCalendar/calendar-be/models');

console.log('Using models path:', calendarBeModelsPath);
let modelsCache = {};

/**
 * Import a model from calendar-be
 * @param {string} modelName - The name of the model to import
 * @returns {mongoose.Model} The mongoose model
 */
async function importModel(modelName) {
  // If we've already imported this model, return it from cache
  if (modelsCache[modelName]) {
    console.log(`Using cached model for ${modelName}`);
    return modelsCache[modelName];
  }
  
  // Special case for MasteredCountry
  if (modelName === 'MasteredCountry') {
    try {
      // Connect to the database to ensure mongoose is ready
      await connectToDatabase();
      
      // Define the model directly
      const Schema = mongoose.Schema;
      
      const masteredCountrySchema = new Schema({
        appId: { type: String, required: true, default: "1" },
        countryName: { type: String, required: true },
        countryCode: { type: String, required: true },
        continent: { type: String, required: true },
        active: { type: Boolean, default: true },
      });
      
      // Get existing model or create a new one
      const model = mongoose.models.masteredCountry || mongoose.model("masteredCountry", masteredCountrySchema);
      
      console.log(`Created direct model for MasteredCountry`);
      modelsCache[modelName] = model;
      return model;
    } catch (err) {
      console.error('Error creating direct model for MasteredCountry:', err);
      throw err;
    }
  }

  // Special case for MasteredRegion
  if (modelName === 'MasteredRegion') {
    try {
      // Connect to the database to ensure mongoose is ready
      await connectToDatabase();
      
      // Define the model directly
      const Schema = mongoose.Schema;
      
      const masteredRegionSchema = new Schema({
        appId: { type: String, required: true, default: "1" },
        regionName: { type: String, required: true },
        regionCode: { type: String, required: true },
        active: { type: Boolean, default: true },
        masteredCountryId: {
          type: Schema.Types.ObjectId,
          ref: "MasteredCountry",
          required: true,
        },
      });
      
      // Get existing model or create a new one
      const model = mongoose.models.masteredRegion || mongoose.model("masteredRegion", masteredRegionSchema);
      
      console.log(`Created direct model for MasteredRegion`);
      modelsCache[modelName] = model;
      return model;
    } catch (err) {
      console.error('Error creating direct model for MasteredRegion:', err);
      throw err;
    }
  }

  // Special case for MasteredDivision
  if (modelName === 'MasteredDivision') {
    try {
      // Connect to the database to ensure mongoose is ready
      await connectToDatabase();
      
      // Define the model directly
      const Schema = mongoose.Schema;
      
      const masteredDivisionSchema = new Schema({
        appId: { type: String, required: true, default: "1" },
        divisionName: { type: String, required: true },
        divisionCode: { type: String, required: true },
        active: { type: Boolean, default: true },
        masteredRegionId: {
          type: Schema.Types.ObjectId,
          ref: "MasteredRegion",
          required: true,
        },
        states: { type: [String], required: true },
      });
      
      // Get existing model or create a new one
      const model = mongoose.models.masteredDivision || mongoose.model("masteredDivision", masteredDivisionSchema);
      
      console.log(`Created direct model for MasteredDivision`);
      modelsCache[modelName] = model;
      return model;
    } catch (err) {
      console.error('Error creating direct model for MasteredDivision:', err);
      throw err;
    }
  }
  
  // Special case for masteredCities directly
  if (modelName === 'MasteredCity') {
    try {
      // Connect to the database to ensure mongoose is ready
      await connectToDatabase();
      
      // Define the model directly
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
          ref: "MasteredDivision",
          required: true,
        },
      });
      
      // 2dsphere index
      masteredCitySchema.index({ location: "2dsphere" });
      
      // Get existing model or create a new one
      const model = mongoose.models.masteredCity || mongoose.model("masteredCity", masteredCitySchema);
      
      console.log(`Created direct model for MasteredCity`);
      modelsCache[modelName] = model;
      return model;
    } catch (err) {
      console.error('Error creating direct model for MasteredCity:', err);
      throw err;
    }
  }

  try {
    // Connect to the database to ensure mongoose is ready
    await connectToDatabase();

    // Determine the correct file to import based on model name
    let modelFileName;
    
    // Handle different model paths
    switch (modelName) {
      case 'UserLogins':
        modelFileName = 'userLogins.js';
        break;
      case 'Roles':
        modelFileName = 'roles.js';
        break;
      case 'MasteredCountry':
        modelFileName = 'masteredCountries.js';
        break;
      case 'MasteredRegion':
        modelFileName = 'masteredRegions.js';
        break;
      case 'MasteredDivision':
        modelFileName = 'masteredDivisions.js';
        break;
      case 'MasteredCity':
        modelFileName = 'masteredCities.js';
        break;
      case 'Organizers':
        modelFileName = 'organizers.js';
        break;
      default:
        modelFileName = `${modelName.toLowerCase()}.js`;
    }
    
    console.log(`Looking for model file: ${modelFileName}`);

    let modelPath = path.join(calendarBeModelsPath, modelFileName);

    console.log(`Attempting to import model ${modelName} from ${modelPath}`);

    // Check if the models directory exists
    if (!fs.existsSync(calendarBeModelsPath)) {
      throw new Error(`Models directory not found: ${calendarBeModelsPath}. Please set the CALENDAR_BE_MODELS_PATH environment variable to the correct path.`);
    }

    // Check if the file exists
    if (!fs.existsSync(modelPath)) {
      // Try different casing for filename (some systems are case-sensitive)
      const dirContents = fs.readdirSync(calendarBeModelsPath);
      console.log('Directory contents:', dirContents);
      
      const alternateFile = dirContents.find(
        file => file.toLowerCase() === modelFileName.toLowerCase()
      );
      
      if (alternateFile) {
        console.log(`Found model with different casing: ${alternateFile}`);
        modelFileName = alternateFile;
        modelPath = path.join(calendarBeModelsPath, modelFileName);
      } else {
        // Try finding similar files
        const possibleMatches = dirContents.filter(
          file => file.toLowerCase().includes(modelName.toLowerCase())
        );
        console.log(`Possible matches for ${modelName}: ${possibleMatches.join(", ")}`);
        
        throw new Error(`Model file not found: ${modelPath}`);
      }
    }

    // List available models
    const availableModels = fs.readdirSync(calendarBeModelsPath)
      .filter(file => file.endsWith('.js'))
      .join(', ');
    console.log(`Available models: ${availableModels}`);

    // Import the model from calendar-be (dynamic import)
    console.log(`Requiring model from: ${modelPath}`);
    const importedModel = require(modelPath);
    
    console.log(`Import result: ${typeof importedModel}`);
    
    if (!importedModel) {
      throw new Error(`Failed to import model from ${modelPath} - returned empty or undefined`);
    }
    
    console.log(`Successfully imported model ${modelName}`);
    
    // Store in cache
    modelsCache[modelName] = importedModel;
    
    return importedModel;
  } catch (error) {
    console.error(`Error importing model ${modelName}:`, error);
    throw error;
  }
}

// Export model getters
export const getModels = async () => {
  try {
    const UserLogins = await importModel('UserLogins');
    const Roles = await importModel('Roles');
    const MasteredCountry = await importModel('MasteredCountry');
    const MasteredRegion = await importModel('MasteredRegion');
    const MasteredDivision = await importModel('MasteredDivision');
    const MasteredCity = await importModel('MasteredCity');
    const Organizers = await importModel('Organizers');
    
    return {
      UserLogins,
      Roles,
      MasteredCountry,
      MasteredRegion,
      MasteredDivision,
      MasteredCity,
      Organizers
    };
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
};

// Export individual model getters
export const getUserLoginsModel = () => importModel('UserLogins');
export const getRolesModel = () => importModel('Roles');
export const getMasteredCountryModel = () => importModel('MasteredCountry');
export const getMasteredRegionModel = () => importModel('MasteredRegion');
export const getMasteredDivisionModel = () => importModel('MasteredDivision');
export const getMasteredCityModel = () => importModel('MasteredCity');
export const getOrganizersModel = () => importModel('Organizers');