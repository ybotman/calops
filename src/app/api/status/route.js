import { NextResponse } from 'next/server';
import axios from 'axios';

/**
 * Status endpoint that checks connectivity to various services
 */
export async function GET() {
  const startTime = new Date();
  
  const services = {
    application: {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      startTime: startTime.toISOString(),
      message: 'CalOps dashboard running (Firebase/MongoDB dependencies removed)'
    },
    backend: {
      status: 'unknown',
      url: process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010',
    },
  };

  // Firebase and MongoDB removed - CalOps now uses backend for all data operations

  // Check Backend API connectivity
  try {
    const timeout = 5000; // 5 second timeout
    const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
    
    console.log(`Checking backend connectivity to: ${backendUrl}`);
    
    // Check if the URL is accessible without a specific API endpoint
    // Often just connecting to the base URL is enough to verify the server is up
    const pingResponse = await axios.head(backendUrl, { 
      timeout,
      validateStatus: (status) => status < 500 // Accept any response that's not a server error
    });
    
    if (pingResponse.status < 500) {
      // Server responded, which means it's running
      services.backend.status = 'ok';
      services.backend.message = 'Backend server is reachable';
      services.backend.responseCode = pingResponse.status;
      
      // Try to get some actual data to verify API functionality
      try {
        const dataResponse = await axios.get(`${backendUrl}/api/userlogins?appId=1&limit=1`, { 
          timeout,
          validateStatus: (status) => status < 500
        });
        if (dataResponse.status === 200) {
          services.backend.apiStatus = 'ok';
          services.backend.message = 'Backend API is fully functional';
        } else {
          services.backend.apiStatus = 'warning';
          services.backend.message = 'Backend server is up, but API returned unexpected status';
        }
      } catch (apiError) {
        services.backend.apiStatus = 'warning';
        services.backend.apiMessage = `API error: ${apiError.message}`;
      }
    } else {
      services.backend.status = 'warning';
      services.backend.message = `Backend responded with unexpected status ${pingResponse.status}`;
    }
  } catch (error) {
    services.backend.status = 'error';
    services.backend.message = `Backend connection error: ${error.message}`;
    console.error('Backend server check failed:', error);
    
    // Try connecting to localhost directly as a fallback
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';
      if (backendUrl !== 'http://localhost:3010') {
        console.log('Trying localhost fallback...');
        const fallbackResponse = await axios.head('http://localhost:3010', { 
          timeout,
          validateStatus: () => true // Accept any response
        });
        
        services.backend.fallbackStatus = 'ok';
        services.backend.fallbackMessage = `Localhost is reachable (status: ${fallbackResponse.status})`;
      }
    } catch (fallbackError) {
      services.backend.fallbackStatus = 'error';
      services.backend.fallbackMessage = 'Localhost connection also failed';
    }
  }

  // Calculate elapsed time
  const endTime = new Date();
  const elapsedMs = endTime - startTime;
  
  // Log a simplified startup message
  console.log('=== CALOPS STATUS ===');
  console.log(`App Version: ${services.application.version}`);
  console.log(`Backend API: ${services.backend.status.toUpperCase()} - ${services.backend.message}`);
  console.log(`Status check completed in ${elapsedMs}ms`);
  console.log('==================');

  return NextResponse.json({
    ...services,
    meta: {
      checkTime: startTime.toISOString(),
      responseTime: elapsedMs,
    }
  });
}