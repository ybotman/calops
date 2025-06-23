#!/usr/bin/env node

/**
 * Test script to verify organizer API connection
 */

import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'https://calendarbe-test-bpg5caaqg5chbndu.eastus-01.azurewebsites.net';
const appId = '1';

async function testOrganizerAPI() {
  console.log('Testing Organizer API...');
  console.log('Backend URL:', backendUrl);
  console.log('App ID:', appId);
  console.log('-------------------');

  try {
    // Test 1: Get organizers
    console.log('Test 1: Fetching organizers...');
    const getResponse = await axios.get(`${backendUrl}/api/organizers`, {
      params: { appId }
    });
    console.log(`✓ Successfully fetched ${Array.isArray(getResponse.data) ? getResponse.data.length : getResponse.data.organizers?.length || 0} organizers`);

    // Test 2: Create organizer
    console.log('\nTest 2: Creating test organizer...');
    const testOrganizer = {
      appId,
      name: 'Test Organizer',
      fullName: 'Test Organizer Full Name',
      shortName: 'TESTORG',
      description: 'Test organizer created via API test',
      isActive: true,
      isApproved: false,
      isEnabled: false,
      organizerTypes: {
        isEventOrganizer: true
      }
    };
    
    console.log('Sending data:', JSON.stringify(testOrganizer, null, 2));
    
    try {
      const createResponse = await axios.post(`${backendUrl}/api/organizers`, testOrganizer);
      console.log('✓ Organizer created successfully:', createResponse.data._id);
      console.log('Response:', JSON.stringify(createResponse.data, null, 2));
      
      // Clean up - delete the test organizer
      if (createResponse.data._id) {
        console.log('\nCleaning up: Deleting test organizer...');
        await axios.delete(`${backendUrl}/api/organizers/${createResponse.data._id}`, {
          params: { appId }
        });
        console.log('✓ Test organizer deleted');
      }
    } catch (createError) {
      console.error('✗ Failed to create organizer:');
      if (createError.response) {
        console.error('Status:', createError.response.status);
        console.error('Data:', JSON.stringify(createError.response.data, null, 2));
      } else {
        console.error(createError.message);
      }
    }

  } catch (error) {
    console.error('✗ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testOrganizerAPI();