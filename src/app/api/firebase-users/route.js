import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

/**
 * GET Firebase users from backend with matching status to userlogins
 * Query params:
 * - appId: Application ID (default: '1')
 * - maxResults: Maximum users to fetch (default: 1000)
 * - forceRefresh: Skip cache (default: false)
 */
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || '1';
    const maxResults = searchParams.get('maxResults') || '1000';
    const forceRefresh = searchParams.get('forceRefresh') || 'false';

    console.log(`Fetching Firebase users from backend: appId=${appId}, maxResults=${maxResults}`);

    // Forward request to backend
    const backendUrl = `${BE_URL}/api/firebase/users?appId=${appId}&maxResults=${maxResults}&forceRefresh=${forceRefresh}`;
    
    const response = await axios.get(backendUrl, {
      timeout: 30000 // 30 second timeout for Firebase operations
    });

    console.log(`Successfully fetched Firebase users: ${response.data?.stats?.total || 0} total`);

    return NextResponse.json(response.data);

  } catch (error) {
    console.error('Error fetching Firebase users:', error);
    
    // Handle specific error types
    let errorMessage = 'Failed to fetch Firebase users';
    let statusCode = 500;
    
    if (error.code === 'ECONNABORTED' || error.response?.status === 504) {
      errorMessage = 'Backend request timed out';
      statusCode = 504;
    } else if (error.response?.status === 503) {
      errorMessage = 'Firebase service unavailable';
      statusCode = 503;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
      statusCode = error.response.status;
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: error.message,
      firebaseUsers: [],
      stats: { total: 0, matched: 0, unmatched: 0 }
    }, { status: statusCode });
  }
}