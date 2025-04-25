# PMR_BTC_EVENT_Import Mapping Verification Tool

This document provides a tool for verifying the entity mapping and resolution process for the BTC to TT import.

## Mapping Verification Tool

```javascript
// mapping-verification.js
// Tool to verify entity resolution and mapping for BTC import

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { 
  resolveVenue, 
  resolveOrganizer, 
  resolveCategory,
  getVenueGeography,
  getUnmatchedReport,
  loadAllCategories
} = require('./entityResolution');
const { mapToTTCategory } = require('../importingBTC/categoryMapping');

// Configuration
const OUTPUT_DIR = path.join(__dirname, 'mapping-verification-results');
const API_TEST_RESULTS_DIR = path.join(__dirname, 'api-test-results');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3010';
const APP_ID = process.env.APP_ID || '1';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Writes verification results to a JSON file
 * @param {string} filename - Output filename
 * @param {Object} data - Data to write
 */
function writeResults(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Results written to ${filePath}`);
}

/**
 * Loads API test results from previous test run
 * @returns {Object|null} Test results or null if not found
 */
function loadApiTestResults() {
  try {
    const filePath = path.join(API_TEST_RESULTS_DIR, 'api-test-results.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  } catch (error) {
    console.error('Error loading API test results:', error.message);
    return null;
  }
}

/**
 * Loads entities from previous API test
 * @returns {Object|null} Entities or null if not found
 */
function loadEntities() {
  try {
    const filePath = path.join(API_TEST_RESULTS_DIR, 'entities.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  } catch (error) {
    console.error('Error loading entities:', error.message);
    return null;
  }
}

/**
 * Verifies venue resolution for all venues in test data
 * @param {Array} venues - List of venues to verify
 * @returns {Promise<Object>} Verification results
 */
async function verifyVenueResolution(venues) {
  console.log(`Verifying resolution for ${venues.length} venues...`);
  
  const results = {
    total: venues.length,
    matched: 0,
    unmatched: 0,
    venues: []
  };
  
  for (const venue of venues) {
    const result = {
      source: venue,
      resolved: null,
      error: null
    };
    
    try {
      const venueId = await resolveVenue(venue);
      
      if (venueId) {
        result.resolved = {
          id: venueId
        };
        
        // Get additional venue info from TT
        try {
          const response = await axios.get(`${API_BASE_URL}/api/venues/${venueId}?appId=${APP_ID}`);
          if (response.data) {
            result.resolved.details = {
              name: response.data.name,
              address: response.data.address1,
              city: response.data.city,
              state: response.data.state
            };
          }
        } catch (detailsError) {
          result.resolved.details = { error: detailsError.message };
        }
        
        results.matched++;
      } else {
        results.unmatched++;
      }
    } catch (error) {
      result.error = error.message;
      results.unmatched++;
    }
    
    results.venues.push(result);
  }
  
  return results;
}

/**
 * Verifies organizer resolution for all organizers in test data
 * @param {Array} organizers - List of organizers to verify
 * @returns {Promise<Object>} Verification results
 */
async function verifyOrganizerResolution(organizers) {
  console.log(`Verifying resolution for ${organizers.length} organizers...`);
  
  const results = {
    total: organizers.length,
    matched: 0,
    unmatched: 0,
    organizers: []
  };
  
  for (const organizer of organizers) {
    const result = {
      source: organizer,
      resolved: null,
      error: null
    };
    
    try {
      const organizerInfo = await resolveOrganizer(organizer);
      
      if (organizerInfo) {
        result.resolved = organizerInfo;
        results.matched++;
      } else {
        results.unmatched++;
      }
    } catch (error) {
      result.error = error.message;
      results.unmatched++;
    }
    
    results.organizers.push(result);
  }
  
  return results;
}

/**
 * Verifies category resolution for all categories in test data
 * @param {Array} categories - List of categories to verify
 * @returns {Promise<Object>} Verification results
 */
async function verifyCategoryResolution(categories) {
  console.log(`Verifying resolution for ${categories.length} categories...`);
  
  // Load all categories first to populate cache
  await loadAllCategories();
  
  const results = {
    total: categories.length,
    matched: 0,
    unmatched: 0,
    ignored: 0,
    categories: []
  };
  
  for (const category of categories) {
    const result = {
      source: category,
      mapping: null,
      resolved: null,
      error: null
    };
    
    try {
      // Get the mapped name first
      const mappedName = mapToTTCategory(category.name);
      result.mapping = mappedName;
      
      if (!mappedName) {
        results.ignored++;
        continue;
      }
      
      const categoryInfo = await resolveCategory(category);
      
      if (categoryInfo) {
        result.resolved = categoryInfo;
        results.matched++;
      } else {
        results.unmatched++;
      }
    } catch (error) {
      result.error = error.message;
      results.unmatched++;
    }
    
    results.categories.push(result);
  }
  
  return results;
}

/**
 * Verifies sample event mapping
 * @param {Object} event - Sample event to map
 * @returns {Promise<Object>} Verification results
 */
async function verifyEventMapping(event) {
  console.log(`Verifying mapping for sample event: ${event.title}`);
  
  const result = {
    sourceEvent: event,
    mappedEvent: null,
    entityResolution: {
      venue: null,
      organizer: null,
      category: null
    },
    geography: null,
    complete: false,
    errors: []
  };
  
  try {
    // Resolve venue
    if (event.venue) {
      const venueId = await resolveVenue(event.venue);
      result.entityResolution.venue = {
        sourceId: event.venue.id,
        sourceName: event.venue.venue,
        resolved: venueId ? true : false,
        targetId: venueId
      };
      
      if (venueId) {
        // Get venue geography
        const geography = await getVenueGeography(venueId);
        if (geography) {
          result.geography = geography;
        } else {
          result.errors.push('Failed to retrieve venue geography');
        }
      } else {
        result.errors.push('Venue not resolved');
      }
    } else {
      result.errors.push('No venue provided');
    }
    
    // Resolve organizer
    if (event.organizer) {
      const organizerInfo = await resolveOrganizer(event.organizer);
      result.entityResolution.organizer = {
        sourceId: event.organizer.id,
        sourceName: event.organizer.organizer,
        resolved: organizerInfo ? true : false,
        targetId: organizerInfo ? organizerInfo.id : null,
        targetName: organizerInfo ? organizerInfo.name : null
      };
      
      if (!organizerInfo) {
        result.errors.push('Organizer not resolved');
      }
    } else {
      result.errors.push('No organizer provided');
    }
    
    // Resolve category
    if (event.categories && event.categories.length > 0) {
      const categoryInfo = await resolveCategory(event.categories[0]);
      result.entityResolution.category = {
        sourceId: event.categories[0].id,
        sourceName: event.categories[0].name,
        mapping: mapToTTCategory(event.categories[0].name),
        resolved: categoryInfo ? true : false,
        targetId: categoryInfo ? categoryInfo.id : null,
        targetName: categoryInfo ? categoryInfo.name : null
      };
      
      if (!categoryInfo && result.entityResolution.category.mapping) {
        result.errors.push('Category not resolved despite having mapping');
      }
    } else {
      result.errors.push('No categories provided');
    }
    
    // Create mapped event object
    result.mappedEvent = {
      title: event.title,
      description: event.description,
      startDate: new Date(event.utc_start_date).toISOString(),
      endDate: new Date(event.utc_end_date).toISOString(),
      allDay: event.all_day,
      appId: APP_ID,
      isDiscovered: true,
      discoveredFirstDate: new Date().toISOString(),
      discoveredLastDate: new Date().toISOString(),
      discoveredComments: `Imported from BTC event ID: ${event.id}`,
      expiresAt: new Date(new Date(event.utc_end_date).getTime() + 86400000).toISOString(), // 1 day after end date
      
      // Entity references
      venueID: result.entityResolution.venue?.targetId,
      ownerOrganizerID: result.entityResolution.organizer?.targetId,
      ownerOrganizerName: result.entityResolution.organizer?.targetName,
      categoryFirstId: result.entityResolution.category?.targetId,
      categoryFirst: result.entityResolution.category?.targetName,
      
      // Geographic information
      venueGeolocation: result.geography?.venueGeolocation,
      masteredCityId: result.geography?.masteredCityId,
      masteredCityName: result.geography?.masteredCityName,
      masteredDivisionId: result.geography?.masteredDivisionId,
      masteredDivisionName: result.geography?.masteredDivisionName,
      masteredRegionId: result.geography?.masteredRegionId,
      masteredRegionName: result.geography?.masteredRegionName,
      
      // Set default status values
      isActive: true,
      isFeatured: false,
      isCanceled: false,
      isOwnerManaged: false
    };
    
    // Determine if mapping is complete
    result.complete = result.entityResolution.venue?.resolved && 
                      result.entityResolution.organizer?.resolved && 
                      result.errors.length === 0;
    
    return result;
  } catch (error) {
    console.error('Error verifying event mapping:', error);
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('Starting mapping verification...');
  
  const verificationResults = {
    timestamp: new Date().toISOString(),
    summary: {
      venues: null,
      organizers: null,
      categories: null,
      sampleEvent: null
    },
    unmatched: null
  };
  
  try {
    // Load entities from API test
    const entities = loadEntities();
    if (!entities) {
      console.error('No entities found from API test. Run the API test first.');
      return;
    }
    
    // Verify venue resolution
    verificationResults.summary.venues = await verifyVenueResolution(entities.venues);
    
    // Verify organizer resolution
    verificationResults.summary.organizers = await verifyOrganizerResolution(entities.organizers);
    
    // Verify category resolution
    verificationResults.summary.categories = await verifyCategoryResolution(entities.categories);
    
    // Load API test results to get a sample event
    const apiTestResults = loadApiTestResults();
    if (apiTestResults && 
        apiTestResults.tests.singleEvent && 
        apiTestResults.tests.singleEvent.success) {
      
      // Verify sample event mapping
      const sampleEvent = apiTestResults.tests.singleEvent.data;
      verificationResults.summary.sampleEvent = await verifyEventMapping(sampleEvent);
    }
    
    // Get report of unmatched entities
    verificationResults.unmatched = getUnmatchedReport();
    
    // Write verification results
    writeResults('mapping-verification-results.json', verificationResults);
    
    // Write separate sample event mapping for easier review
    if (verificationResults.summary.sampleEvent) {
      writeResults('sample-event-mapping.json', verificationResults.summary.sampleEvent);
    }
    
    // Write unmatched report separately
    writeResults('unmatched-entities.json', verificationResults.unmatched);
    
    // Print summary
    console.log('\nVerification Summary:');
    console.log(`Venues: ${verificationResults.summary.venues.matched}/${verificationResults.summary.venues.total} matched`);
    console.log(`Organizers: ${verificationResults.summary.organizers.matched}/${verificationResults.summary.organizers.total} matched`);
    console.log(`Categories: ${verificationResults.summary.categories.matched}/${verificationResults.summary.categories.total} matched (${verificationResults.summary.categories.ignored} ignored)`);
    
    if (verificationResults.summary.sampleEvent) {
      console.log(`Sample event mapping: ${verificationResults.summary.sampleEvent.complete ? 'Complete' : 'Incomplete'}`);
      if (verificationResults.summary.sampleEvent.errors.length > 0) {
        console.log(`- Errors: ${verificationResults.summary.sampleEvent.errors.join(', ')}`);
      }
    }
    
    return verificationResults;
  } catch (error) {
    console.error('Verification execution error:', error);
    verificationResults.error = error.message;
    writeResults('mapping-verification-error.json', verificationResults);
    return verificationResults;
  }
}

/**
 * Generates recommendations for improving entity mapping
 * @param {Object} verificationResults - Results from verification run
 * @returns {Object} Recommendations
 */
function generateRecommendations(verificationResults) {
  const recommendations = {
    missingEntities: {
      venues: [],
      organizers: [],
      categories: []
    },
    actionItems: []
  };
  
  // Find top unmatched venues
  if (verificationResults.unmatched && verificationResults.unmatched.venues) {
    recommendations.missingEntities.venues = verificationResults.unmatched.venues
      .slice(0, 10) // Top 10
      .map(name => ({
        name,
        recommendation: 'Create venue in TT or check for alternate spellings'
      }));
      
    if (recommendations.missingEntities.venues.length > 0) {
      recommendations.actionItems.push('Create missing venues in TangoTiempo');
    }
  }
  
  // Find top unmatched organizers
  if (verificationResults.unmatched && verificationResults.unmatched.organizers) {
    recommendations.missingEntities.organizers = verificationResults.unmatched.organizers
      .slice(0, 10) // Top 10
      .map(name => ({
        name,
        recommendation: 'Create organizer in TT or add btcNiceName to existing organizer'
      }));
      
    if (recommendations.missingEntities.organizers.length > 0) {
      recommendations.actionItems.push('Add btcNiceName to organizers in TangoTiempo');
    }
  }
  
  // Find top unmatched categories
  if (verificationResults.unmatched && verificationResults.unmatched.categories) {
    recommendations.missingEntities.categories = verificationResults.unmatched.categories
      .slice(0, 10) // Top 10
      .map(name => ({
        name,
        recommendation: 'Add mapping in categoryMapping.js'
      }));
      
    if (recommendations.missingEntities.categories.length > 0) {
      recommendations.actionItems.push('Update category mapping configuration');
    }
  }
  
  // Check sample event mapping
  if (verificationResults.summary && verificationResults.summary.sampleEvent) {
    const sampleEvent = verificationResults.summary.sampleEvent;
    
    if (!sampleEvent.complete) {
      recommendations.actionItems.push('Address sample event mapping issues before proceeding');
      
      // Add specific recommendations based on errors
      sampleEvent.errors.forEach(error => {
        if (error.includes('Venue not resolved')) {
          recommendations.actionItems.push(`Create venue: ${sampleEvent.sourceEvent.venue.venue}`);
        }
        if (error.includes('Organizer not resolved')) {
          recommendations.actionItems.push(`Create organizer: ${sampleEvent.sourceEvent.organizer.organizer}`);
        }
        if (error.includes('Category not resolved')) {
          recommendations.actionItems.push(`Update category mapping for: ${sampleEvent.sourceEvent.categories[0].name}`);
        }
      });
    }
  }
  
  return recommendations;
}

// Run verification if this file is executed directly
if (require.main === module) {
  runVerification().then(results => {
    if (results) {
      const recommendations = generateRecommendations(results);
      writeResults('recommendations.json', recommendations);
      
      console.log('\nRecommendations:');
      recommendations.actionItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item}`);
      });
    }
  });
}

module.exports = {
  runVerification,
  generateRecommendations
};
```

## Running the Mapping Verification Tool

To execute the mapping verification:

1. First, run the WordPress API test to generate input data:
   ```bash
   node wordpress-api-test.js
   ```

2. Then run the mapping verification tool:
   ```bash
   node mapping-verification.js
   ```

3. Examine the output files in the `mapping-verification-results` directory:
   - `mapping-verification-results.json` - Complete verification results
   - `sample-event-mapping.json` - Sample event mapping details
   - `unmatched-entities.json` - Report of unmatched entities
   - `recommendations.json` - Recommended actions to improve mapping

## Verification Report Analysis

The mapping verification tool provides several key insights:

### 1. Entity Resolution Statistics

The report includes match rates for each entity type:
- **Venues**: What percentage of BTC venues match to TT venues
- **Organizers**: What percentage of BTC organizers match to TT organizers
- **Categories**: What percentage of BTC categories map to TT categories

### 2. Sample Event Mapping

A complete transformation of a sample event shows:
- All field mappings from BTC to TT format
- Entity resolution results for the event's venue, organizer, and category
- Geographic information derived from the venue
- Any issues preventing complete mapping

### 3. Unmatched Entities Report

The unmatched report identifies:
- Which BTC venues don't have TT counterparts
- Which BTC organizers don't have TT counterparts
- Which BTC categories don't have mappings

### 4. Recommendations

Based on verification results, the tool generates actionable recommendations:
- Create specific missing venues in TT
- Add `btcNiceName` to existing organizers in TT
- Update category mapping configuration
- Address specific issues with sample event mapping

## Implementation Tasks Based on Verification

After running verification, implement the following:

1. **Create Missing Entities**:
   - Add venues identified in the unmatched report
   - Create organizers identified in the unmatched report
   - Update category mapping for unmapped categories

2. **Update Entity Resolution**:
   - Add `btcNiceName` to existing organizers to improve matching
   - Implement fuzzy matching for venues if exact match rates are low
   - Refine category mapping rules based on verification results

3. **Fine-tune Event Mapping**:
   - Address any fields that didn't map correctly in the sample event
   - Ensure geographic information is properly propagated
   - Verify date/time conversion to UTC