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
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
