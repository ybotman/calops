/**
 * Script to seed roles into the TangoTiempo system
 * 
 * Usage: 
 * node scripts/seed-roles.js [--appId=1] [--force]
 * 
 * Options:
 * --appId=1    Application ID (default: 1 for TangoTiempo)
 * --force      Force overwrite existing roles
 * 
 * Environment variables:
 * - MONGODB_URI: MongoDB connection string (default: mongodb://localhost:27017)
 * - DB_NAME: Database name (default: TangoTiempo)
 * - APP_ID: Application ID (default: 1)
 * 
 * This script reads the roles from be-info/masterdata/roles.json and seeds them into the database.
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Parse command line arguments
const args = process.argv.slice(2);
let options = {
  appId: '1',
  force: false
};

// Extract options from command line
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const [key, value] = args[i].slice(2).split('=');
    if (key === 'force') {
      options.force = true;
    } else {
      options[key] = value || true;
    }
  }
}

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'TangoTiempo';
const ROLE_COLLECTION = 'roles';
const APP_ID = process.env.APP_ID || options.appId || '1';

// Role name code mappings for consistency
const ROLE_NAME_CODES = {
  'SystemOwner': 'SYO',
  'SystemAdmin': 'SYA', 
  'RegionalAdmin': 'RGA',
  'RegionalOrganizer': 'RGO',
  'BasicUser': 'USR',
  'Anonymous': 'ANO'
};

async function seedRoles() {
  console.log(`Starting roles seeding for appId: ${APP_ID}`);
  console.log(`Force mode: ${options.force ? 'ON' : 'OFF'}`);
  
  // Read roles data from masterdata
  let rolesData;
  try {
    const rolesFilePath = path.join(__dirname, '..', 'be-info', 'masterdata', 'roles.json');
    const fileContent = fs.readFileSync(rolesFilePath, 'utf8');
    rolesData = JSON.parse(fileContent);
    
    if (!Array.isArray(rolesData)) {
      throw new Error('Roles data must be an array');
    }
    
    console.log(`Found ${rolesData.length} roles in masterdata file`);
  } catch (error) {
    console.error(`Error reading roles masterdata: ${error.message}`);
    process.exit(1);
  }

  // Connect to MongoDB
  let client;
  try {
    console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
    
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const db = client.db(DB_NAME);
    const roleCollection = db.collection(ROLE_COLLECTION);
    
    // Check for existing roles
    const existingRoles = await roleCollection.find({ appId: APP_ID }).toArray();
    console.log(`Found ${existingRoles.length} existing roles for appId ${APP_ID}`);
    
    if (existingRoles.length > 0 && !options.force) {
      console.log('Roles already exist. Use --force to overwrite.');
      console.log('Existing roles:');
      existingRoles.forEach(role => {
        console.log(`  - ${role.roleName} (${role.roleNameCode})`);
      });
      return;
    }
    
    // Prepare roles for seeding
    const rolesToSeed = rolesData.map(role => ({
      ...role,
      appId: APP_ID,
      roleNameCode: ROLE_NAME_CODES[role.roleName] || role.roleName.substring(0, 3).toUpperCase(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Stats tracking
    const stats = {
      total: rolesToSeed.length,
      created: 0,
      updated: 0,
      errors: 0,
      details: []
    };
    
    // Process each role
    for (const roleData of rolesToSeed) {
      try {
        const filter = { 
          roleName: roleData.roleName, 
          appId: APP_ID 
        };
        
        const existingRole = await roleCollection.findOne(filter);
        
        if (existingRole) {
          if (options.force) {
            // Update existing role
            const updateResult = await roleCollection.updateOne(
              filter,
              { 
                $set: {
                  ...roleData,
                  updatedAt: new Date()
                }
              }
            );
            
            stats.updated++;
            stats.details.push({
              roleName: roleData.roleName,
              action: 'updated',
              roleNameCode: roleData.roleNameCode
            });
            console.log(`Updated role: ${roleData.roleName} (${roleData.roleNameCode})`);
          } else {
            stats.details.push({
              roleName: roleData.roleName,
              action: 'skipped',
              reason: 'already exists'
            });
            console.log(`Skipped role: ${roleData.roleName} (already exists)`);
          }
        } else {
          // Create new role
          const insertResult = await roleCollection.insertOne(roleData);
          
          stats.created++;
          stats.details.push({
            roleName: roleData.roleName,
            action: 'created',
            roleNameCode: roleData.roleNameCode,
            id: insertResult.insertedId
          });
          console.log(`Created role: ${roleData.roleName} (${roleData.roleNameCode})`);
        }
      } catch (roleError) {
        console.error(`Error processing role ${roleData.roleName}: ${roleError.message}`);
        stats.errors++;
        stats.details.push({
          roleName: roleData.roleName,
          action: 'error',
          error: roleError.message
        });
      }
    }
    
    // Print summary
    printSummary(stats);
    writeLogFile(stats);
    
    // Verify seeding
    const finalRoles = await roleCollection.find({ appId: APP_ID }).toArray();
    console.log(`\nVerification: ${finalRoles.length} roles now exist for appId ${APP_ID}`);
    finalRoles.forEach(role => {
      console.log(`  - ${role.roleName} (${role.roleNameCode}) - ${role._id}`);
    });
    
  } catch (error) {
    console.error(`Database error: ${error.message}`);
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
  console.log('\nSeeding Summary:');
  console.log('===============');
  console.log(`Total roles processed: ${stats.total}`);
  console.log(`Roles created: ${stats.created}`);
  console.log(`Roles updated: ${stats.updated}`);
  console.log(`Errors: ${stats.errors}`);
}

// Helper function to write log file
function writeLogFile(stats) {
  const logFile = path.join(__dirname, 'roles-seed-log.json');
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    appId: APP_ID,
    force: options.force,
    stats,
    details: stats.details
  }, null, 2));
  
  console.log(`\nDetailed log written to: ${logFile}`);
}

// Run the script
seedRoles().catch(console.error);