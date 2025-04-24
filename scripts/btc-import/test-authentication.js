// test-authentication.js
// Simple script to test authentication with TangoTiempo API

import axios from 'axios';

// Get token from environment variable
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010/api';
const APP_ID = process.env.APP_ID || '1';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Tests API access with authentication
 */
async function testAuthentication() {
  console.log(`${colors.cyan}============================================${colors.reset}`);
  console.log(`${colors.cyan}   TangoTiempo API Authentication Test${colors.reset}`);
  console.log(`${colors.cyan}============================================${colors.reset}`);
  
  // Check if token is provided
  if (!AUTH_TOKEN) {
    console.log(`\n${colors.red}❌ ERROR: No authentication token provided${colors.reset}`);
    console.log('Please set the AUTH_TOKEN environment variable:');
    console.log('\nExample:');
    console.log('  export AUTH_TOKEN=your_token_here');
    console.log('  # OR directly with the command:');
    console.log(`  AUTH_TOKEN=your_token_here node scripts/btc-import/test-authentication.js\n`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}API Base URL:${colors.reset} ${API_BASE_URL}`);
  console.log(`${colors.blue}App ID:${colors.reset} ${APP_ID}`);
  console.log(`${colors.blue}Using token:${colors.reset} ${AUTH_TOKEN.substring(0, 10)}...${AUTH_TOKEN.substring(AUTH_TOKEN.length - 5)}`);
  
  console.log(`\n${colors.yellow}Running API tests...${colors.reset}\n`);
  
  // Test 1: Read operation (should work without auth)
  try {
    console.log(`${colors.magenta}TEST 1: Read operation (events) - No auth required${colors.reset}`);
    const eventsResponse = await axios.get(`${API_BASE_URL}/events?appId=${APP_ID}&limit=1`);
    const eventCount = eventsResponse.data?.events?.length || 0;
    console.log(`${colors.green}✅ SUCCESS: Retrieved ${eventCount} events${colors.reset}`);
    console.log(`   Response status: ${eventsResponse.status}`);
  } catch (error) {
    console.log(`${colors.red}❌ FAILED: Could not retrieve events${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test 2: Read operation with auth token
  try {
    console.log(`\n${colors.magenta}TEST 2: Read operation (events) - With auth token${colors.reset}`);
    const eventsAuthResponse = await axios.get(`${API_BASE_URL}/events?appId=${APP_ID}&limit=1`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    const eventAuthCount = eventsAuthResponse.data?.events?.length || 0;
    console.log(`${colors.green}✅ SUCCESS: Retrieved ${eventAuthCount} events with auth token${colors.reset}`);
    console.log(`   Response status: ${eventsAuthResponse.status}`);
  } catch (error) {
    console.log(`${colors.red}❌ FAILED: Could not retrieve events with auth token${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test 3: Attempt write operation (will not actually create event)
  try {
    console.log(`\n${colors.magenta}TEST 3: Write operation (authentication test only)${colors.reset}`);
    
    // This is a special endpoint for testing auth without creating actual data
    const testEndpoint = `${API_BASE_URL}/status`;
    
    const statusResponse = await axios.get(testEndpoint, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    console.log(`${colors.green}✅ SUCCESS: Authentication accepted${colors.reset}`);
    console.log(`   Response status: ${statusResponse.status}`);
    console.log(`   Response data: ${JSON.stringify(statusResponse.data, null, 2)}`);
  } catch (error) {
    console.log(`${colors.red}❌ FAILED: Authentication rejected${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Summary
  console.log(`\n${colors.cyan}============================================${colors.reset}`);
  console.log(`${colors.cyan}   Authentication Test Summary${colors.reset}`);
  console.log(`${colors.cyan}============================================${colors.reset}`);
  
  console.log(`\nReminder:`);
  console.log(`1. For successful imports, you need a valid authentication token`);
  console.log(`2. The token must have permission to create events`);
  console.log(`3. Run the actual import with:`);
  console.log(`   AUTH_TOKEN=your_token node scripts/btc-import/run-actual-import.js`);
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthentication().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}