import { NextResponse } from 'next/server';

/**
 * Analytics API Proxy
 *
 * Proxies analytics requests to Azure Functions backend with function key authentication.
 * This keeps the function key server-side only (secure).
 *
 * Routes handled:
 * - /api/analytics/event-creation
 * - /api/analytics/login-history
 * - /api/analytics/visitor-history
 * - /api/analytics/* (any other analytics endpoints)
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_AF_URL || 'http://localhost:7071';
const FUNCTIONS_KEY = process.env.AZURE_FUNCTIONS_KEY;

async function proxyRequest(request, path) {
  try {
    // Build the backend URL with query params
    const url = new URL(request.url);
    const backendUrl = `${BACKEND_URL}/api/analytics/${path}${url.search}`;

    // Prepare headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Add function key if configured
    if (FUNCTIONS_KEY) {
      headers['x-functions-key'] = FUNCTIONS_KEY;
    } else {
      console.warn('Analytics proxy: AZURE_FUNCTIONS_KEY not configured');
    }

    // Forward authorization header if present
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    // Make the request to the backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      // Don't include body for GET requests
      ...(request.method !== 'GET' && request.method !== 'HEAD'
        ? { body: await request.text() }
        : {}),
    });

    // Handle non-OK responses
    if (!response.ok) {
      const text = await response.text();
      console.error(`Analytics proxy: Backend returned ${response.status}`, text.substring(0, 200));
      return NextResponse.json(
        {
          success: false,
          error: `Backend error: ${response.status}`,
          backendUrl: backendUrl.replace(FUNCTIONS_KEY || '', '***'),
          details: text.substring(0, 200)
        },
        { status: response.status }
      );
    }

    // Get response data
    const data = await response.json();

    // Return with same status code
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Analytics proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics data',
        message: error.message,
        backendUrl: BACKEND_URL
      },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  const path = params.path.join('/');
  return proxyRequest(request, path);
}

export async function POST(request, { params }) {
  const path = params.path.join('/');
  return proxyRequest(request, path);
}
