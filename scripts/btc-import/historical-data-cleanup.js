// historical-data-cleanup.js
// Script to clean up historical event data with backup
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Configuration
const config = {
  // TangoTiempo API
  ttApiBase: process.env.TT_API_BASE || 'http://localhost:3010/api',
  
  // TangoTiempo app ID
  appId: process.env.APP_ID || '1',
  
  // Authentication token for TT API (REQUIRED)
  authToken: process.env.AUTH_TOKEN || null,
  
  // Output directory for backup files
  outputDir: process.env.OUTPUT_DIR || path.join(rootDir, 'import-results/historical-cleanup'),
  
  // Default to dry-run mode
  dryRun: process.env.DRY_RUN !== 'false',
  
  // Target date in YYYY-MM-DD format (default: none, needs to be specified)
  targetDate: process.env.TARGET_DATE || null
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

/**
 * Checks if authentication token is available
 */
function checkAuthentication() {
  if (!config.authToken) {
    console.log('\n❌ ERROR: Authentication token is required for data cleanup.');
    console.log('Please provide an authentication token via the AUTH_TOKEN environment variable:');
    console.log('\nExample:');
    console.log('  export AUTH_TOKEN=your_token_here');
    console.log('  # OR directly with the command:');
    console.log('  AUTH_TOKEN=your_token_here node scripts/btc-import/historical-data-cleanup.js');
    return false;
  }
  
  console.log('✅ Authentication token is available.');
  return true;
}

/**
 * Validates that a target date is provided
 */
function validateTargetDate() {
  if (!config.targetDate) {
    console.log('\n❌ ERROR: Target date is required for data cleanup.');
    console.log('Please provide a target date via the TARGET_DATE environment variable:');
    console.log('\nExample:');
    console.log('  export TARGET_DATE=2025-07-23');
    console.log('  # OR directly with the command:');
    console.log('  TARGET_DATE=2025-07-23 node scripts/btc-import/historical-data-cleanup.js');
    return false;
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(config.targetDate)) {
    console.log('\n❌ ERROR: Invalid date format. Please use YYYY-MM-DD format.');
    return false;
  }
  
  console.log(`✅ Target date is valid: ${config.targetDate}`);
  return true;
}

/**
 * Retrieves events from TT API for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} Array of TT events
 */
async function fetchEventsForDate(date) {
  const startOfDay = `${date}T00:00:00.000Z`;
  const endOfDay = `${date}T23:59:59.999Z`;
  
  try {
    console.log(`Fetching events for date: ${date}`);
    
    const response = await axios.get(`${config.ttApiBase}/events`, {
      params: {
        appId: config.appId,
        start: startOfDay,
        end: endOfDay
      },
      headers: {
        Authorization: `Bearer ${config.authToken}`
      }
    });
    
    const events = response.data.events || [];
    console.log(`Found ${events.length} events for date: ${date}`);
    
    return events;
  } catch (error) {
    console.error(`Error fetching events for date ${date}:`, error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    throw error;
  }
}

/**
 * Creates a backup of events for the specified date
 * @param {Array} events - Array of events to backup
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Path to backup file
 */
function backupEvents(events, date) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(config.outputDir, `backup-events-${date}-${timestamp}.json`);
  
  console.log(`Creating backup for ${events.length} events (date: ${date})`);
  fs.writeFileSync(backupFile, JSON.stringify(events, null, 2));
  
  console.log(`Backup saved to: ${backupFile}`);
  return backupFile;
}

/**
 * Deletes an event from TT
 * @param {Object} event - Event to delete
 * @param {boolean} isDryRun - Whether this is a dry run
 * @returns {Promise<boolean>} Success status
 */
async function deleteEvent(event, isDryRun) {
  if (isDryRun) {
    console.log(`[DRY RUN] Would delete event: ${event.title} (${event._id})`);
    return true;
  }
  
  try {
    console.log(`Deleting event: ${event.title} (${event._id})`);
    
    await axios.delete(`${config.ttApiBase}/events/${event._id}`, {
      headers: {
        Authorization: `Bearer ${config.authToken}`
      }
    });
    
    console.log(`✅ Successfully deleted event: ${event.title} (${event._id})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete event: ${event.title} (${event._id}):`, error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    return false;
  }
}

/**
 * Cleans up events for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupEventsForDate(date) {
  const results = {
    date,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
    totalEvents: 0,
    deletedEvents: 0,
    failedEvents: 0,
    dryRun: config.dryRun,
    backupFile: null
  };
  
  try {
    // Fetch events for the date
    const events = await fetchEventsForDate(date);
    results.totalEvents = events.length;
    
    if (events.length === 0) {
      console.log(`No events found for date: ${date}. Nothing to clean up.`);
      results.endTime = new Date().toISOString();
      results.duration = (new Date() - new Date(results.startTime)) / 1000;
      return results;
    }
    
    // Create backup
    const backupFile = backupEvents(events, date);
    results.backupFile = backupFile;
    
    // Delete events
    for (const event of events) {
      const success = await deleteEvent(event, config.dryRun);
      
      if (success) {
        results.deletedEvents++;
      } else {
        results.failedEvents++;
      }
    }
    
    // Calculate results
    results.endTime = new Date().toISOString();
    results.duration = (new Date() - new Date(results.startTime)) / 1000;
    
    return results;
  } catch (error) {
    console.error(`Failed to clean up events for date: ${date}`, error.message);
    
    results.endTime = new Date().toISOString();
    results.duration = (new Date() - new Date(results.startTime)) / 1000;
    results.error = error.message;
    
    throw error;
  }
}

/**
 * Restores events from a backup file
 * @param {string} backupFile - Path to backup file
 * @returns {Promise<Object>} Restore results
 */
async function restoreFromBackup(backupFile) {
  const results = {
    startTime: new Date().toISOString(),
    endTime: null,
    duration: null,
    backupFile,
    totalEvents: 0,
    restoredEvents: 0,
    failedEvents: 0
  };
  
  try {
    // Read backup file
    console.log(`Restoring from backup: ${backupFile}`);
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    results.totalEvents = backupData.length;
    
    if (backupData.length === 0) {
      console.log('Backup file contains no events. Nothing to restore.');
      results.endTime = new Date().toISOString();
      results.duration = (new Date() - new Date(results.startTime)) / 1000;
      return results;
    }
    
    // Restore each event
    for (const event of backupData) {
      try {
        console.log(`Restoring event: ${event.title} (${event._id})`);
        
        // Remove _id to create a new event
        const eventData = { ...event };
        delete eventData._id;
        delete eventData.__v;
        
        // Create new event
        const response = await axios.post(`${config.ttApiBase}/events/post`, eventData, {
          headers: {
            Authorization: `Bearer ${config.authToken}`
          }
        });
        
        console.log(`✅ Successfully restored event: ${event.title} (${response.data._id})`);
        results.restoredEvents++;
      } catch (error) {
        console.error(`❌ Failed to restore event: ${event.title}:`, error.message);
        if (error.response) {
          console.error('API Response:', error.response.data);
        }
        results.failedEvents++;
      }
    }
    
    // Calculate results
    results.endTime = new Date().toISOString();
    results.duration = (new Date() - new Date(results.startTime)) / 1000;
    
    return results;
  } catch (error) {
    console.error(`Failed to restore from backup: ${backupFile}`, error.message);
    
    results.endTime = new Date().toISOString();
    results.duration = (new Date() - new Date(results.startTime)) / 1000;
    results.error = error.message;
    
    throw error;
  }
}

/**
 * Main function to run the cleanup
 */
async function run() {
  try {
    console.log('========================================================');
    console.log(' Historical Data Cleanup');
    console.log('========================================================');
    console.log(`Target Date: ${config.targetDate || 'NOT SPECIFIED'}`);
    console.log(`Dry Run: ${config.dryRun}`);
    console.log(`Output Directory: ${config.outputDir}`);
    console.log('--------------------------------------------------------');
    
    // Validate configuration
    if (!checkAuthentication() || !validateTargetDate()) {
      process.exit(1);
    }
    
    // Confirmation dialog
    if (process.argv.indexOf('--confirm') === -1) {
      console.log('\n❗ WARNING: This will DELETE events for the specified date.');
      console.log('Events will be backed up, but this is a destructive operation.');
      console.log('To bypass this confirmation, rerun with the --confirm flag.\n');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      try {
        const answer = await new Promise((resolve) => {
          readline.question('Type "CONFIRM" to proceed with the cleanup: ', resolve);
        });
        
        if (answer.trim().toUpperCase() !== 'CONFIRM') {
          console.log('Cleanup cancelled by user.');
          process.exit(0);
        }
      } finally {
        readline.close();
      }
    } else {
      console.log('Running with --confirm flag. Bypassing confirmation dialog.');
    }
    
    // Run cleanup
    const results = await cleanupEventsForDate(config.targetDate);
    
    // Print summary
    console.log('\nCleanup Summary:');
    console.log(`Date: ${results.date}`);
    console.log(`Duration: ${results.duration.toFixed(2)} seconds`);
    console.log(`Total Events: ${results.totalEvents}`);
    console.log(`Deleted Events: ${results.deletedEvents}`);
    console.log(`Failed Events: ${results.failedEvents}`);
    console.log(`Dry Run: ${results.dryRun}`);
    
    if (results.backupFile) {
      console.log(`Backup File: ${results.backupFile}`);
    }
    
    // Save results
    const resultsFile = path.join(config.outputDir, `cleanup-results-${config.targetDate}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(`\nResults saved to: ${resultsFile}`);
    
    if (results.dryRun) {
      console.log('\nThis was a DRY RUN. No events were actually deleted.');
      console.log('To perform actual deletion, rerun with DRY_RUN=false');
    } else {
      console.log('\nTo restore from backup if needed, run:');
      console.log(`node scripts/btc-import/historical-data-cleanup.js --restore "${results.backupFile}"`);
    }
    
    return results;
  } catch (error) {
    console.error('Cleanup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Handles restore operation from backup
 * @param {string} backupFile - Path to backup file
 */
async function handleRestore(backupFile) {
  try {
    console.log('========================================================');
    console.log(' Restore Events from Backup');
    console.log('========================================================');
    console.log(`Backup File: ${backupFile}`);
    console.log('--------------------------------------------------------');
    
    // Validate configuration
    if (!checkAuthentication()) {
      process.exit(1);
    }
    
    // Confirmation dialog
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    try {
      const answer = await new Promise((resolve) => {
        readline.question('Type "RESTORE" to proceed with restoration: ', resolve);
      });
      
      if (answer.trim().toUpperCase() !== 'RESTORE') {
        console.log('Restore cancelled by user.');
        process.exit(0);
      }
    } finally {
      readline.close();
    }
    
    // Run restore
    const results = await restoreFromBackup(backupFile);
    
    // Print summary
    console.log('\nRestore Summary:');
    console.log(`Duration: ${results.duration.toFixed(2)} seconds`);
    console.log(`Total Events: ${results.totalEvents}`);
    console.log(`Restored Events: ${results.restoredEvents}`);
    console.log(`Failed Events: ${results.failedEvents}`);
    
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(config.outputDir, `restore-results-${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    console.log(`\nResults saved to: ${resultsFile}`);
    
    return results;
  } catch (error) {
    console.error('Restore failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check if restore flag is provided
  const restoreIndex = process.argv.indexOf('--restore');
  if (restoreIndex !== -1 && process.argv[restoreIndex + 1]) {
    const backupFile = process.argv[restoreIndex + 1];
    handleRestore(backupFile);
  } else {
    run();
  }
}

export {
  run,
  cleanupEventsForDate,
  restoreFromBackup
};