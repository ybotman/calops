// API route for importing events from Boston Tango Calendar
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { processSingleDayImport, performGoNoGoAssessment } from '../../../../../btc-import.js';

// Simple error logging function
const logError = (message, error) => {
  console.error(message, error);
};

/**
 * Handles the POST request to import events from BTC
 * @param {Request} request - The HTTP request
 * @returns {NextResponse} - The HTTP response
 */
export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { startDate, endDate, dryRun = true, appId = '1' } = body;
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: 'Missing required parameters: startDate and endDate are required' },
        { status: 400 }
      );
    }
    
    // Get authentication token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Authentication token is required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Set environment variables for btc-import.js
    process.env.AUTH_TOKEN = token;
    process.env.DRY_RUN = String(dryRun);
    process.env.APP_ID = appId;
    
    try {
      // Process each date in the range
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Track overall results
      const overallResults = {
        dateRange: {
          start: startDate,
          end: endDate
        },
        btcEvents: {
          total: 0,
          processed: 0
        },
        entityResolution: {
          success: 0,
          failure: 0
        },
        validation: {
          valid: 0,
          invalid: 0
        },
        ttEvents: {
          deleted: 0,
          created: 0,
          failed: 0
        },
        dryRun: dryRun,
        duration: 0,
        dates: [],
        startTime: new Date().toISOString(),
        endTime: null
      };
      
      // Only process the start date initially for simplicity
      // In a future enhancement, we could process the entire date range
      const currentDate = startDateObj.toISOString().split('T')[0];
      
      // Run the import process for the current date
      console.log(`Processing import for date: ${currentDate}`);
      const dateResults = await processSingleDayImport(currentDate);
      
      // Aggregate results
      overallResults.btcEvents.total += dateResults.btcEvents.total;
      overallResults.btcEvents.processed += dateResults.btcEvents.processed;
      overallResults.entityResolution.success += dateResults.entityResolution.success;
      overallResults.entityResolution.failure += dateResults.entityResolution.failure;
      overallResults.validation.valid += dateResults.validation.valid;
      overallResults.validation.invalid += dateResults.validation.invalid;
      overallResults.ttEvents.deleted += dateResults.ttEvents.deleted;
      overallResults.ttEvents.created += dateResults.ttEvents.created;
      overallResults.ttEvents.failed += dateResults.ttEvents.failed;
      overallResults.duration += dateResults.duration;
      
      // Get the failed events from the output directory
      try {
        const failedEventsPath = path.join(process.cwd(), 'import-results', `failed-events-${currentDate}.json`);
        if (fs.existsSync(failedEventsPath)) {
          const failedEventsData = fs.readFileSync(failedEventsPath, 'utf8');
          dateResults.failedEvents = JSON.parse(failedEventsData);
        }
      } catch (error) {
        console.error('Failed to read failed events file:', error);
      }
      
      // Add date-specific results
      overallResults.dates.push({
        date: currentDate,
        results: dateResults
      });
      
      // Complete the results
      overallResults.endTime = new Date().toISOString();
      
      // Perform Go/No-Go assessment on overall results
      const assessment = performGoNoGoAssessment(overallResults);
      
      // Return combined results with assessment
      return NextResponse.json({
        ...overallResults,
        assessment,
        // Additional metadata for UI
        progressTracking: {
          totalDates: 1, // Currently only processing the start date
          completedDates: 1,
          currentStatus: 'Complete'
        }
      });
    } catch (importError) {
      console.error('Import process error:', importError);
      
      return NextResponse.json(
        { 
          message: 'Error during import process', 
          error: importError.message,
          partialResults: importError.partialResults || null
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log the error
    logError('Error in BTC import API:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        message: 'Error importing events', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}