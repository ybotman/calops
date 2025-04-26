// API route for retrieving BTC organizer import logs
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Handles GET requests to retrieve BTC organizer import logs
 * @param {Request} request - The HTTP request
 * @returns {NextResponse} - The HTTP response with organizer resolution logs
 */
export async function GET(request) {
  try {
    // Set the base output directory
    const outputDir = process.env.OUTPUT_DIR || path.join(process.cwd(), 'import-results');
    const organizerLogsDir = path.join(outputDir, 'organizer-resolution');
    
    // Check if the directory exists
    if (!fs.existsSync(organizerLogsDir)) {
      return NextResponse.json(
        { message: 'No organizer resolution logs found' },
        { status: 404 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const status = searchParams.get('status'); // 'success' or 'failure'
    
    // Read all log files in the directory
    const files = fs.readdirSync(organizerLogsDir)
      .filter(file => file.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)); // Sort newest first based on timestamp
    
    // Get the summary file if it exists
    let summary = null;
    const summaryPath = path.join(organizerLogsDir, 'resolution-summary.log');
    if (fs.existsSync(summaryPath)) {
      summary = fs.readFileSync(summaryPath, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .slice(-100); // Get the last 100 entries
    }
    
    // Process and filter logs based on status
    const logs = [];
    let count = 0;
    
    for (const file of files) {
      if (count >= limit) break;
      
      const filePath = path.join(organizerLogsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        const log = JSON.parse(content);
        
        // Filter by status if provided
        if (status && String(log.success) !== (status === 'success' ? 'true' : 'false')) {
          continue;
        }
        
        logs.push(log);
        count++;
      } catch (parseError) {
        console.error(`Error parsing log file ${file}:`, parseError);
      }
    }
    
    // Return logs and stats
    return NextResponse.json({
      totalLogs: files.length,
      returnedLogs: logs.length,
      summary: summary,
      logs: logs,
      stats: {
        successCount: logs.filter(log => log.success).length,
        failureCount: logs.filter(log => !log.success).length,
        methodsUsed: countMethodsUsed(logs)
      }
    });
  } catch (error) {
    console.error('Error retrieving organizer logs:', error);
    
    return NextResponse.json(
      { 
        message: 'Error retrieving organizer logs', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * Count the methods used for resolution attempts
 * @param {Array} logs - The logs to analyze
 * @returns {Object} - Counts of each method used
 */
function countMethodsUsed(logs) {
  const methods = {};
  
  logs.forEach(log => {
    if (log.attempts && Array.isArray(log.attempts)) {
      log.attempts.forEach(attempt => {
        if (attempt.method) {
          methods[attempt.method] = (methods[attempt.method] || 0) + 1;
        }
      });
    }
  });
  
  return methods;
}