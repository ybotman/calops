import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

export async function GET() {
  try {
    // Test backend connection with a health check
    const response = await axios.get(`${BE_URL}/health`);
    
    // Test API calls
    const [rolesResponse, userResponse] = await Promise.all([
      axios.get(`${BE_URL}/api/roles?appId=1`).catch(e => ({ 
        status: e.response?.status || 500,
        error: e.message 
      })),
      axios.get(`${BE_URL}/api/userlogins/all?appId=1`).catch(e => ({ 
        status: e.response?.status || 500,
        error: e.message 
      }))
    ]);
    
    return NextResponse.json({
      success: true,
      backendUrl: BE_URL,
      backendHealth: response.data,
      apiTests: {
        roles: rolesResponse.data ? {
          status: 'success',
          count: Array.isArray(rolesResponse.data) ? rolesResponse.data.length : 'unknown',
          sample: Array.isArray(rolesResponse.data) && rolesResponse.data.length > 0 
            ? rolesResponse.data[0] 
            : null
        } : {
          status: 'error',
          error: rolesResponse.error
        },
        users: userResponse.data ? {
          status: 'success',
          count: Array.isArray(userResponse.data) ? userResponse.data.length : 'unknown',
          sample: Array.isArray(userResponse.data) && userResponse.data.length > 0 
            ? {
                id: userResponse.data[0]._id,
                firebaseId: userResponse.data[0].firebaseUserId,
                name: `${userResponse.data[0].localUserInfo?.firstName || ''} ${userResponse.data[0].localUserInfo?.lastName || ''}`.trim(),
                roles: userResponse.data[0].roleIds?.length || 0
              } 
            : null
        } : {
          status: 'error',
          error: userResponse.error
        }
      }
    });
  } catch (error) {
    console.error('Backend connection error:', error);
    return NextResponse.json({
      success: false,
      backendUrl: BE_URL,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      message: "Failed to connect to backend. Make sure the calendar-be server is running and NEXT_PUBLIC_BE_URL is set correctly."
    }, { status: 500 });
  }
}