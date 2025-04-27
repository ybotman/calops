/**
 * Venues Import BTC API - Imports venues from BTC
 * This route handles importing venues from BTC, with name uniqueness checking and logging
 */

import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Base URL for the API - defaults to localhost:3010
const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
const LOG_DIR = path.join(process.cwd(), 'import-results');

/**
 * Ensures the log directory exists
 */
const ensureLogDir = () => {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
};

/**
 * Writes logs to file
 * @param {string} filename - Log filename
 * @param {Object} data - Data to log
 */
const writeLog = (filename, data) => {
  ensureLogDir();
  const filePath = path.join(LOG_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

export async function POST(request) {
  try {
    const body = await request.json();
    const options = body.options || {};
    const appId = body.appId || '1';
    
    // Get timestamp for logging
    const timestamp = new Date().toISOString().split('T')[0];
    const logs = [];

    // Log options
    logs.push({
      type: 'info',
      message: 'Starting BTC venues import',
      details: `Options: ${JSON.stringify(options)}`
    });

    try {
      // Fetch BTC venues
      logs.push({ type: 'info', message: 'Fetching BTC venues' });
      const btcResponse = await axios.get(`${BE_URL}/api/events/import-btc/venues?appId=${appId}`);
      
      const btcVenues = btcResponse.data.venues || [];
      if (!btcVenues.length) {
        logs.push({ type: 'error', message: 'No BTC venues found' });
        return NextResponse.json({
          message: 'No BTC venues found',
          logs,
          total: 0,
          imported: 0,
          failed: 0,
          skipped: 0
        });
      }

      logs.push({ 
        type: 'info', 
        message: `Found ${btcVenues.length} BTC venues`, 
        details: `Will now process these venues` 
      });

      // Fetch existing venues for comparison
      const existingResponse = await axios.get(`${BE_URL}/api/venues?appId=${appId}`);
      const existingVenues = Array.isArray(existingResponse.data) ? 
        existingResponse.data : 
        (existingResponse.data.data || existingResponse.data.venues || []);

      logs.push({ 
        type: 'info', 
        message: `Found ${existingVenues.length} existing venues`,
        details: `Will check BTC venues against these`
      });

      // Process each BTC venue
      const results = {
        total: btcVenues.length,
        imported: 0,
        failed: 0,
        skipped: 0
      };

      const importedVenues = [];
      const failedVenues = [];
      const skippedVenues = [];

      for (const btcVenue of btcVenues) {
        try {
          // Check if venue already exists by name
          const venueName = btcVenue.name || btcVenue.venueName;
          if (!venueName) {
            logs.push({ 
              type: 'error', 
              message: `Venue missing name`,
              details: JSON.stringify(btcVenue) 
            });
            failedVenues.push({ 
              venue: btcVenue, 
              reason: 'Missing venue name' 
            });
            results.failed++;
            continue;
          }

          // Check if venue exists by name
          const existingVenue = options.uniqueNameCheck ? 
            existingVenues.find(v => 
              (v.name || '').toLowerCase() === venueName.toLowerCase() ||
              (v.displayName || '').toLowerCase() === venueName.toLowerCase()
            ) : null;

          if (existingVenue && !options.updateExisting) {
            logs.push({ 
              type: 'info', 
              message: `Skipping existing venue: ${venueName}`,
              details: `Venue already exists with ID: ${existingVenue._id || existingVenue.id}` 
            });
            skippedVenues.push({ 
              venue: btcVenue, 
              existingId: existingVenue._id || existingVenue.id,
              reason: 'Venue already exists and updateExisting is false' 
            });
            results.skipped++;
            continue;
          }

          // Prepare venue data
          const venueData = {
            appId,
            name: venueName,
            address1: btcVenue.address || btcVenue.address1 || '',
            address2: btcVenue.address2 || '',
            city: btcVenue.city || '',
            state: btcVenue.state || btcVenue.province || '',
            zip: btcVenue.postalCode || btcVenue.zip || '',
            phone: btcVenue.phone || '',
            latitude: btcVenue.latitude || (btcVenue.location?.coordinates?.[1]) || null,
            longitude: btcVenue.longitude || (btcVenue.location?.coordinates?.[0]) || null,
            geolocation: btcVenue.location || (
              btcVenue.latitude && btcVenue.longitude ? {
                type: 'Point',
                coordinates: [btcVenue.longitude, btcVenue.latitude]
              } : null
            ),
            source: 'BTC Import',
            sourceId: btcVenue.id || btcVenue._id || null
          };

          // If updating existing venue
          if (existingVenue && options.updateExisting) {
            logs.push({ 
              type: 'info', 
              message: `Updating existing venue: ${venueName}`,
              details: `Venue ID: ${existingVenue._id || existingVenue.id}` 
            });

            const updateResponse = await axios.put(
              `${BE_URL}/api/venues/${existingVenue._id || existingVenue.id}?appId=${appId}`, 
              { ...venueData, appId }
            );

            logs.push({ 
              type: 'success', 
              message: `Updated venue: ${venueName}`,
              details: `Venue ID: ${existingVenue._id || existingVenue.id}` 
            });
            
            importedVenues.push({
              ...updateResponse.data,
              isUpdate: true
            });
            results.imported++;
          } else {
            // Create new venue
            logs.push({ 
              type: 'info', 
              message: `Creating new venue: ${venueName}`
            });

            const createResponse = await axios.post(
              `${BE_URL}/api/venues?appId=${appId}`, 
              venueData
            );

            logs.push({ 
              type: 'success', 
              message: `Created venue: ${venueName}`,
              details: `New venue ID: ${createResponse.data._id || createResponse.data.id}` 
            });
            
            importedVenues.push({
              ...createResponse.data,
              isNew: true
            });
            results.imported++;
          }
        } catch (venueError) {
          logs.push({ 
            type: 'error', 
            message: `Failed to process venue: ${btcVenue.name || 'Unknown venue'}`,
            details: venueError.message 
          });
          failedVenues.push({ 
            venue: btcVenue, 
            error: venueError.message,
            reason: 'API error during processing' 
          });
          results.failed++;
        }
      }

      // Validate geolocation for imported venues if requested
      if (options.validateGeo && importedVenues.length > 0) {
        logs.push({ 
          type: 'info', 
          message: `Validating geolocation for ${importedVenues.length} venues` 
        });

        const venueIds = importedVenues.map(v => v._id || v.id);
        
        try {
          const validationResponse = await axios.post(
            `${BE_URL}/api/venues/batch-validate-geo`,
            {
              venueIds,
              fallbackToDefault: options.fallbackToDefaults,
              appId
            }
          );

          logs.push({ 
            type: 'success', 
            message: `Validated geolocation for ${validationResponse.data.validated || 0} venues`,
            details: `Failed: ${validationResponse.data.failed || 0}` 
          });
        } catch (validationError) {
          logs.push({ 
            type: 'error', 
            message: `Failed to validate geolocation for venues`,
            details: validationError.message 
          });
        }
      }

      // Write logs to file
      try {
        writeLog(`btc-venues-import-${timestamp}.json`, {
          timestamp,
          options,
          results,
          logs
        });
        
        if (importedVenues.length > 0) {
          writeLog(`btc-venues-imported-${timestamp}.json`, importedVenues);
        }
        
        if (failedVenues.length > 0) {
          writeLog(`btc-venues-failed-${timestamp}.json`, failedVenues);
        }
        
        if (skippedVenues.length > 0) {
          writeLog(`btc-venues-skipped-${timestamp}.json`, skippedVenues);
        }
      } catch (logError) {
        logs.push({ 
          type: 'error', 
          message: `Failed to write logs to file`,
          details: logError.message 
        });
      }

      // Return results
      return NextResponse.json({
        message: `BTC venues import completed: ${results.imported} imported, ${results.failed} failed, ${results.skipped} skipped`,
        logs,
        ...results
      });
    } catch (btcError) {
      console.error('Error fetching or processing BTC venues:', btcError);
      
      logs.push({ 
        type: 'error', 
        message: 'Error fetching or processing BTC venues',
        details: btcError.message 
      });
      
      // Write error log
      try {
        writeLog(`btc-venues-import-error-${timestamp}.json`, {
          timestamp,
          options,
          error: btcError.message,
          logs
        });
      } catch (logError) {
        console.error('Failed to write error log:', logError);
      }

      const status = btcError.response?.status || 500;
      const message = btcError.response?.data?.message || btcError.message || 'Unknown error';
      
      return NextResponse.json(
        { 
          error: message,
          logs
        },
        { status }
      );
    }
  } catch (error) {
    console.error('Error processing venue import request:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during venue import',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}