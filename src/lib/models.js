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
                            path.resolve(process.cwd(), '../calendar-be/models');

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
    return modelsCache[modelName];
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
      case 'MasteredRegion':
      case 'MasteredDivision':
      case 'MasteredCity':
        if (modelName === 'MasteredCountry') modelFileName = 'masteredCountries.js';
        if (modelName === 'MasteredRegion') modelFileName = 'masteredRegions.js';
        if (modelName === 'MasteredDivision') modelFileName = 'masteredDivisions.js';
        if (modelName === 'MasteredCity') modelFileName = 'masteredCities.js';
        break;
      case 'Organizers':
        modelFileName = 'organizers.js';
        break;
      default:
        modelFileName = `${modelName.toLowerCase()}.js`;
    }

    const modelPath = path.join(calendarBeModelsPath, modelFileName);

    console.log(`Attempting to import model ${modelName} from ${modelPath}`);

    // Check if the models directory exists
    if (!fs.existsSync(calendarBeModelsPath)) {
      throw new Error(`Models directory not found: ${calendarBeModelsPath}. Please set the CALENDAR_BE_MODELS_PATH environment variable to the correct path.`);
    }

    // Check if the file exists
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found: ${modelPath}`);
    }

    // List available models
    const availableModels = fs.readdirSync(calendarBeModelsPath)
      .filter(file => file.endsWith('.js'))
      .join(', ');
    console.log(`Available models: ${availableModels}`);

    // Import the model from calendar-be (dynamic import)
    const importedModel = require(modelPath);
    
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