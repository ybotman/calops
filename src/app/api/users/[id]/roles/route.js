import { NextResponse } from 'next/server';
import axios from 'axios';

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

/**
 * PUT - Update user roles
 * This endpoint specifically focuses on updating user roles
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    const { roleIds } = await request.json();
    
    // Validate input
    if (!roleIds || roleIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one role must be assigned to a user' },
        { status: 400 }
      );
    }
    
    // Forward request to backend
    const response = await axios.put(`${BE_URL}/api/userlogins/${id}/roles`, {
      roleIds,
      appId
    });
    
    return NextResponse.json({
      message: 'User roles updated successfully',
      user: response.data
    });
    
  } catch (error) {
    console.error(`Error updating roles for user ${params.id}:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to update user roles', 
        details: error.response?.data?.message || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
}