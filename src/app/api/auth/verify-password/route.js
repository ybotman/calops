import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Function to hash a password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Verify password from the auth.json file
export async function POST(request) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Password is required' 
      }, { status: 400 });
    }
    
    // Calculate hash of the submitted password
    const hashedPassword = hashPassword(password);
    
    // Read the stored hash from auth.json
    const authFilePath = path.join(process.cwd(), 'public', 'pwd', 'auth.json');
    const authFile = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
    
    // Check if the hash matches
    if (hashedPassword === authFile.pwdHash) {
      // Set a cookie to maintain the session
      const cookieStore = cookies();
      cookieStore.set('auth_token', hashedPassword, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });
      
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid password' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}