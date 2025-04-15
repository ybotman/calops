/**
 * Script to import Firebase users into the TangoTiempo system via the REST API
 * 
 * Usage: 
 * 1. Save your Firebase user data as a JSON file (e.g., firebase-users.json)
 * 2. Run: node scripts/import-firebase-users.js ./path/to/firebase-users.json
 * 
 * Optional environment variables:
 * - API_URL: Backend API URL (default: http://localhost:3010)
 * - APP_ID: Application ID (default: 1 for TangoTiempo)
 * 
 * Examples:
 * - Basic usage: node scripts/import-firebase-users.js ./firebase-users.json
 * - With custom API: API_URL="http://your-backend-url" node scripts/import-firebase-users.js ./firebase-users.json
 * 
 * This script uses the REST API to import users but falls back to direct MongoDB connection if needed.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');

// Parse command line arguments for options
const args = process.argv.slice(2);
let filePath = null;
let options = {};

// Extract options from command line
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const [key, value] = args[i].slice(2).split('=');
    options[key] = value;
  } else if (!filePath) {
    filePath = args[i];
  }
}

// API configuration
const API_URL = process.env.API_URL || options.apiUrl || 'http://localhost:3010';
const API_IMPORT_ENDPOINT = '/api/userlogins/import-firebase';

// MongoDB configuration (fallback only)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'TangoTiempo';
const USER_COLLECTION = 'userLogins';
const ROLE_COLLECTION = 'roles';
const APP_ID = process.env.APP_ID || options.appId || '1'; // Default to TangoTiempo

// Main function
async function importUsers() {
  // Check for input file
  if (!filePath) {
    console.error('Error: No input file specified');
    console.log(`
Usage: node scripts/import-firebase-users.js ./path/to/firebase-users.json [options]

Options:
  --apiUrl=http://localhost:3010    Backend API URL
  --appId=1                         Application ID

Environment variables:
  API_URL                           Backend API URL
  APP_ID                            Application ID
    `);
    process.exit(1);
  }

  // Read and parse the input file
  let firebaseUsers;
  try {
    const fileContent = fs.readFileSync(path.resolve(filePath), 'utf8');
    const json = JSON.parse(fileContent);
    
    // Handle different formats (array or object with users property)
    if (Array.isArray(json)) {
      firebaseUsers = json;
    } else if (json.users && Array.isArray(json.users)) {
      firebaseUsers = json.users;
    } else {
      firebaseUsers = [json]; // Single user
    }
    
    console.log(`Parsed ${firebaseUsers.length} users from input file`);
  } catch (error) {
    console.error(`Error reading/parsing the input file: ${error.message}`);
    process.exit(1);
  }

  // Stats tracking
  const stats = {
    total: firebaseUsers.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  console.log(`Attempting to import ${firebaseUsers.length} users via API at ${API_URL}${API_IMPORT_ENDPOINT}`);
  
  // Try API approach first
  try {
    const apiResponse = await axios.post(`${API_URL}${API_IMPORT_ENDPOINT}`, {
      firebaseUsers,
      appId: APP_ID
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (apiResponse.data && apiResponse.data.success) {
      console.log('Successfully imported users through the API');
      
      // Update our stats with the API response stats
      Object.assign(stats, apiResponse.data.stats);
      
      // Print summary
      printSummary(stats);
      writeLogFile(stats, 'api');
      
      return; // Exit early since API method worked
    } else {
      console.warn('API responded but reported failure:', apiResponse.data?.error || 'Unknown error');
      // Continue to fallback approach
    }
  } catch (apiError) {
    console.error(`API import failed: ${apiError.message}`);
    console.log('Falling back to direct MongoDB connection...');
    
    if (apiError.response) {
      console.error(`Status: ${apiError.response.status}`);
      console.error('Response data:', apiError.response.data);
    } else if (apiError.request) {
      console.error('No response received from API - backend might be down');
    }
  }
  
  // Fallback to direct MongoDB approach
  let client;
  try {
    console.log(`\nAPI approach failed. Connecting directly to MongoDB at ${MONGODB_URI} as fallback...`);
    console.log('NOTE: This should only be used when the backend API is unavailable.');
    
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      connectTimeoutMS: 10000, // 10 seconds before timing out connection
      socketTimeoutMS: 45000, // 45 seconds for operations timeout
    });
    
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const db = client.db(DB_NAME);
    const userCollection = db.collection(USER_COLLECTION);
    const roleCollection = db.collection(ROLE_COLLECTION);
    
    // Find the User role
    const userRole = await roleCollection.findOne({ roleName: 'User', appId: APP_ID });
    if (!userRole) {
      console.warn('Warning: User role not found. Users will be created without roles.');
    } else {
      console.log(`Found User role with ID: ${userRole._id}`);
    }
    
    // Find RegionalOrganizer role for advanced users
    const regionalOrganizerRole = await roleCollection.findOne({ roleName: 'RegionalOrganizer', appId: APP_ID });
    if (regionalOrganizerRole) {
      console.log(`Found RegionalOrganizer role with ID: ${regionalOrganizerRole._id}`);
    }
    
    // Process each user
    for (const fbUser of firebaseUsers) {
      try {
        // Extract basic info - handle different Firebase export formats
        const uid = fbUser.uid || fbUser.localId;
        const email = fbUser.email;
        const displayName = fbUser.displayName || fbUser.name;
        const isRO = fbUser.isRegionalOrganizer || false; // Optional flag to mark user as RegionalOrganizer
        
        if (!uid) {
          console.warn('Skipping user with no UID');
          stats.skipped++;
          stats.details.push({ uid: 'missing', reason: 'No UID provided' });
          continue;
        }
        
        // Parse name
        let firstName = '';
        let lastName = '';
        
        if (displayName) {
          const nameParts = displayName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        // Check if user already exists
        const existingUser = await userCollection.findOne({ 
          firebaseUserId: uid,
          appId: APP_ID
        });
        
        if (existingUser) {
          // Update existing user
          const updateSet = {
            active: true,
            'localUserInfo.isActive': true,
            updatedAt: new Date()
          };
          
          // Only update name if it's provided and current values are empty
          if (firstName && (!existingUser.localUserInfo || !existingUser.localUserInfo.firstName)) {
            updateSet['localUserInfo.firstName'] = firstName;
          }
          
          if (lastName && (!existingUser.localUserInfo || !existingUser.localUserInfo.lastName)) {
            updateSet['localUserInfo.lastName'] = lastName;
          }
          
          // Update roles if needed
          if (isRO && regionalOrganizerRole && (!existingUser.roleIds || !existingUser.roleIds.some(id => 
            id.toString() === regionalOrganizerRole._id.toString()))) {
            updateSet.roleIds = [...(existingUser.roleIds || []), regionalOrganizerRole._id];
          } else if (userRole && (!existingUser.roleIds || existingUser.roleIds.length === 0)) {
            updateSet.roleIds = [userRole._id];
          }
          
          const updateResult = await userCollection.updateOne(
            { _id: existingUser._id },
            { $set: updateSet }
          );
          
          stats.updated++;
          stats.details.push({ 
            uid, 
            action: 'updated', 
            email, 
            roles: updateSet.roleIds ? 'modified' : 'unchanged' 
          });
          console.log(`Updated user: ${uid} - ${email || 'No email'}`);
        } else {
          // Create new user
          const roleIds = [];
          if (isRO && regionalOrganizerRole) {
            roleIds.push(regionalOrganizerRole._id);
            roleIds.push(userRole._id); // Also add User role
          } else if (userRole) {
            roleIds.push(userRole._id);
          }
          
          const newUser = {
            firebaseUserId: uid,
            appId: APP_ID,
            active: true,
            localUserInfo: {
              firstName,
              lastName,
              isActive: true
            },
            roleIds,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const insertResult = await userCollection.insertOne(newUser);
          
          stats.created++;
          stats.details.push({ 
            uid, 
            action: 'created', 
            email,
            roles: isRO ? 'RegionalOrganizer+User' : 'User'
          });
          console.log(`Created user: ${uid} - ${email || 'No email'}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${fbUser.uid || fbUser.localId || 'unknown'}: ${userError.message}`);
        stats.errors++;
        stats.details.push({ 
          uid: fbUser.uid || fbUser.localId || 'unknown', 
          action: 'error', 
          error: userError.message 
        });
      }
    }
    
    // Print summary
    printSummary(stats);
    writeLogFile(stats, 'mongodb');
    
  } catch (error) {
    console.error(`MongoDB fallback error: ${error.message}`);
    console.error('\nBoth API and direct MongoDB approaches failed.');
    console.error('Please ensure the backend server is running on port 3010 or specify the correct API URL.');
    console.error('Example: API_URL="http://localhost:3010" node scripts/import-firebase-users.js ./path/to/firebase-users.json');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Helper function to print summary
function printSummary(stats) {
  console.log('\nImport Summary:');
  console.log('==============');
  console.log(`Total users processed: ${stats.total}`);
  console.log(`Users created: ${stats.created}`);
  console.log(`Users updated: ${stats.updated}`);
  console.log(`Users skipped: ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);
}

// Helper function to write log file
function writeLogFile(stats, method) {
  const logFile = path.join(__dirname, 'firebase-import-log.json');
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    method,
    config: method === 'api' 
      ? { 
          apiUrl: API_URL,
          appId: APP_ID
        } 
      : {
          mongoUri: MONGODB_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@'),
          dbName: DB_NAME,
          appId: APP_ID
        },
    stats,
    details: stats.details
  }, null, 2));
  
  console.log(`\nDetailed log written to: ${logFile}`);
}

// Run the script
importUsers().catch(console.error);