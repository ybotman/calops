# PMR_BTC_EVENT_Import WordPress API Test

This document provides a test script and implementation details for validating access to the Boston Tango Calendar WordPress API.

## WordPress API Test Script

```javascript
// wordpress-api-test.js
// Test script to validate Boston Tango Calendar WordPress API access

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BTC_API_BASE = 'https://bostontangocalendar.com/wp-json/tribe/events/v1';
const OUTPUT_DIR = path.join(__dirname, 'api-test-results');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Formats a date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Fetches events for a specific date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Promise<Object>} API response
 */
async function fetchEvents(startDate, endDate) {
  try {
    console.log(`Fetching events from ${startDate} to ${endDate}...`);
    
    const response = await axios.get(`${BTC_API_BASE}/events`, {
      params: {
        start_date: startDate,
        end_date: endDate,
        per_page: 50 // Maximum number of events per page
      }
    });
    
    return {
      success: true,
      data: response.data,
      status: response.status,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    };
  }
}

/**
 * Fetches a specific event by ID
 * @param {string|number} eventId - Event ID
 * @returns {Promise<Object>} API response
 */
async function fetchEventById(eventId) {
  try {
    console.log(`Fetching event ID: ${eventId}...`);
    
    const response = await axios.get(`${BTC_API_BASE}/events/${eventId}`);
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    };
  }
}

/**
 * Writes test results to a JSON file
 * @param {string} filename - Output filename
 * @param {Object} data - Data to write
 */
function writeResults(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Results written to ${filePath}`);
}

/**
 * Extracts unique venues and organizers from events
 * @param {Array} events - List of events
 * @returns {Object} Extracted entities
 */
function extractEntities(events) {
  const venues = new Map();
  const organizers = new Map();
  const categories = new Map();
  
  events.forEach(event => {
    // Extract venue
    if (event.venue && event.venue.id) {
      venues.set(event.venue.id, event.venue);
    }
    
    // Extract organizer
    if (event.organizer && event.organizer.id) {
      organizers.set(event.organizer.id, event.organizer);
    }
    
    // Extract categories
    if (event.categories) {
      event.categories.forEach(category => {
        categories.set(category.id, category);
      });
    }
  });
  
  return {
    venues: Array.from(venues.values()),
    organizers: Array.from(organizers.values()),
    categories: Array.from(categories.values())
  };
}

/**
 * Main test function
 */
async function runTests() {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  try {
    // Test 1: Fetch current month's events
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const currentMonthResponse = await fetchEvents(
      formatDate(firstDayOfMonth),
      formatDate(lastDayOfMonth)
    );
    
    testResults.tests.currentMonth = currentMonthResponse;
    
    // Test 2: Fetch events for a specific day
    const specificDate = formatDate(today);
    const singleDayResponse = await fetchEvents(specificDate, specificDate);
    
    testResults.tests.singleDay = singleDayResponse;
    
    // Test 3: Fetch future events (next 90 days)
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 90);
    
    const futureResponse = await fetchEvents(
      formatDate(today),
      formatDate(futureDate)
    );
    
    testResults.tests.future = futureResponse;
    
    // If we have events, test fetching a specific event
    if (currentMonthResponse.success && 
        currentMonthResponse.data.events && 
        currentMonthResponse.data.events.length > 0) {
      
      const testEventId = currentMonthResponse.data.events[0].id;
      const eventResponse = await fetchEventById(testEventId);
      
      testResults.tests.singleEvent = eventResponse;
    }
    
    // Extract entities from all events
    const allEvents = [];
    
    if (currentMonthResponse.success && currentMonthResponse.data.events) {
      allEvents.push(...currentMonthResponse.data.events);
    }
    
    if (futureResponse.success && futureResponse.data.events) {
      // Use Set to deduplicate events that might be in both responses
      const eventIds = new Set(allEvents.map(e => e.id));
      futureResponse.data.events.forEach(event => {
        if (!eventIds.has(event.id)) {
          allEvents.push(event);
        }
      });
    }
    
    const entities = extractEntities(allEvents);
    testResults.entities = entities;
    
    // Calculate statistics
    testResults.stats = {
      totalEvents: allEvents.length,
      uniqueVenues: entities.venues.length,
      uniqueOrganizers: entities.organizers.length,
      uniqueCategories: entities.categories.length
    };
    
    // Verify rate limits from headers
    if (currentMonthResponse.success && currentMonthResponse.headers) {
      testResults.rateLimits = {
        'x-ratelimit-limit': currentMonthResponse.headers['x-ratelimit-limit'],
        'x-ratelimit-remaining': currentMonthResponse.headers['x-ratelimit-remaining'],
        'x-ratelimit-reset': currentMonthResponse.headers['x-ratelimit-reset']
      };
    }
    
    // Save all results
    writeResults('api-test-results.json', testResults);
    
    // Save sample event data separately for easier reference
    if (testResults.tests.singleEvent && testResults.tests.singleEvent.success) {
      writeResults('sample-event.json', testResults.tests.singleEvent.data);
    }
    
    // Save entities separately
    writeResults('entities.json', testResults.entities);
    
    console.log('API Tests completed successfully');
    console.log('Statistics:');
    console.log(`- Total Events: ${testResults.stats.totalEvents}`);
    console.log(`- Unique Venues: ${testResults.stats.uniqueVenues}`);
    console.log(`- Unique Organizers: ${testResults.stats.uniqueOrganizers}`);
    console.log(`- Unique Categories: ${testResults.stats.uniqueCategories}`);
    
    return testResults;
  } catch (error) {
    console.error('Test execution error:', error);
    testResults.error = error.message;
    writeResults('api-test-error.json', testResults);
    return testResults;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  fetchEvents,
  fetchEventById,
  runTests
};
```

## Running the Test Script

To execute the WordPress API test:

1. Install required dependencies:
   ```bash
   npm install axios
   ```

2. Run the test script:
   ```bash
   node wordpress-api-test.js
   ```

3. Examine the output files in the `api-test-results` directory:
   - `api-test-results.json` - Complete test results
   - `sample-event.json` - Sample event structure
   - `entities.json` - Extracted venues, organizers, and categories

## API Response Analysis

### Event Structure

The WordPress Events Calendar API returns events in the following format:

```json
{
  "id": 12345,
  "global_id": "bostontangocalendar.com?id=12345",
  "title": "Event Title",
  "description": "HTML description...",
  "start_date": "2025-05-01 19:00:00",
  "start_date_details": {
    "year": "2025",
    "month": "05",
    "day": "01",
    "hour": "19",
    "minutes": "00",
    "seconds": "00"
  },
  "end_date": "2025-05-01 22:00:00",
  "end_date_details": {...},
  "utc_start_date": "2025-05-01 23:00:00",
  "utc_end_date": "2025-05-02 02:00:00",
  "timezone": "America/New_York",
  "all_day": false,
  "url": "https://bostontangocalendar.com/event/event-title/",
  "cost": "$20",
  "venue": {
    "id": 678,
    "venue": "Dance Studio Name",
    "address": "123 Main St",
    "city": "Boston",
    "country": "United States",
    "state": "MA",
    "zip": "02110",
    "phone": "",
    "url": "",
    "stateprovince": "MA"
  },
  "organizer": {
    "id": 901,
    "organizer": "Organizer Name",
    "email": "email@example.com",
    "phone": "",
    "url": "",
    "slug": "organizer-name"
  },
  "categories": [
    {
      "id": 234,
      "name": "Class",
      "slug": "class",
      "description": "",
      "taxonomy": "tribe_events_cat"
    }
  ],
  "tags": [],
  "image": {
    "url": "https://bostontangocalendar.com/wp-content/uploads/2025/04/event-image.jpg",
    "id": 5678,
    "title": "Event Image",
    "sizes": {...}
  }
}
```

### Rate Limits

The API includes rate limit headers:

- `x-ratelimit-limit`: Maximum number of requests per time window
- `x-ratelimit-remaining`: Remaining requests in current window
- `x-ratelimit-reset`: Time (in seconds) until the rate limit resets

## Implementation Recommendations

Based on the API test results:

1. **Pagination Handling**:
   - Test response includes `rest_url` for next page when available
   - Implement pagination to handle large result sets

2. **Date Handling**:
   - Use `utc_start_date` and `utc_end_date` for consistent timezone handling
   - Check `timezone` field for source event timezone information

3. **Rate Limit Management**:
   - Implement delays between requests based on rate limit headers
   - Add exponential backoff for retry attempts

4. **Error Handling**:
   - Capture and log full error responses
   - Implement specific handling for common errors (404, 429, 503)
   
5. **Data Validation**:
   - Verify required fields exist in each event (title, dates, venue, organizer)
   - Check for missing or null values in critical fields