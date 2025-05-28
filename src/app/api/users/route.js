import { NextResponse } from 'next/server';
import { getApiDatabase } from '@/lib/api-database';
import { getUserLoginsModel } from '@/lib/models';
import firebaseAdmin from '@/lib/firebase-admin'; // Import the improved firebase admin object

// Simple in-memory rate limiter
const rateLimiter = {
  // Map of IP addresses to their request counts
  requests: new Map(),
  
  // Timestamp of the last cleanup
  lastCleanup: Date.now(),
  
  // Configuration
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 30, // Maximum 30 requests per minute
  cleanupInterval: 5 * 60 * 1000, // Clean up old entries every 5 minutes
  
  /**
   * Check if a request from a given IP should be rate limited
   * @param {string} ip - The IP address
   * @returns {boolean} - True if the request should be rate limited
   */
  shouldRateLimit(ip) {
    // Clean up old entries if needed
    this._cleanup();
    
    // Get current timestamp
    const now = Date.now();
    
    // Get or create entry for this IP
    if (!this.requests.has(ip)) {
      this.requests.set(ip, {
        count: 0,
        resetAt: now + this.windowMs
      });
    }
    
    const entry = this.requests.get(ip);
    
    // Reset count if the window has passed
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + this.windowMs;
    }
    
    // Increment count
    entry.count++;
    
    // Rate limit if over maximum
    return entry.count > this.maxRequests;
  },
  
  /**
   * Get retry-after time for rate limited requests
   * @param {string} ip - The IP address
   * @returns {number} - Seconds to wait before retrying
   */
  getRetryAfterSeconds(ip) {
    if (!this.requests.has(ip)) {
      return 60; // Default to 1 minute
    }
    
    const entry = this.requests.get(ip);
    return Math.ceil((entry.resetAt - Date.now()) / 1000);
  },
  
  /**
   * Clean up old entries
   * @private
   */
  _cleanup() {
    const now = Date.now();
    
    // Only clean up periodically
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }
    
    // Update cleanup timestamp
    this.lastCleanup = now;
    
    // Remove old entries
    for (const [ip, entry] of this.requests.entries()) {
      if (now > entry.resetAt) {
        this.requests.delete(ip);
      }
    }
  }
};

// Utility to get client IP from request
function getClientIp(request) {
  // Try forwarded header first (for proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Try real IP header next
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Default to a placeholder
  return 'unknown-client';
}

// Cache to store recent responses
const responseCache = {
  cache: new Map(),
  maxAge: 30 * 1000, // 30 seconds
  
  /**
   * Get a cached response for a request
   * @param {string} key - Cache key
   * @returns {Object|null} - The cached response or null
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const entry = this.cache.get(key);
    const now = Date.now();
    
    // Check if entry is still valid
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  },
  
  /**
   * Store a response in the cache
   * @param {string} key - Cache key
   * @param {Object} data - Response data
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Cleanup old entries if cache is getting large
    if (this.cache.size > 100) {
      this._cleanup();
    }
  },
  
  /**
   * Clean up old entries
   * @private
   */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
};

// GET handler - Get all users or filter by parameters
export async function GET(request) {
  try {
    // Get client IP for rate limiting
    const clientIp = getClientIp(request);
    
    // Rate limit check
    if (rateLimiter.shouldRateLimit(clientIp)) {
      const retryAfter = rateLimiter.getRetryAfterSeconds(clientIp);
      console.warn(`Rate limiting client ${clientIp}, retry after ${retryAfter}s`);
      
      return NextResponse.json({ 
        error: 'Too many requests, please try again later',
        users: [], 
        pagination: { total: 0, page: 1, limit: 10 }
      }, { 
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(rateLimiter.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfter)
        }
      });
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId') || "1";
    const active = searchParams.has('active') ? searchParams.get('active') === 'true' : undefined;
    const timestamp = searchParams.get('_');
    
    // Build query string for backend request
    let queryString = `appId=${appId}`;
    if (active !== undefined) {
      queryString += `&active=${active}`;
    }
    
    // Create cache key based on query parameters
    const cacheKey = `users-${appId}-${active}-${timestamp || ''}`;
    
    // Check cache unless timestamp is provided (which indicates a forced refresh)
    if (!timestamp) {
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse) {
        console.log(`Using cached response for ${cacheKey}`);
        return NextResponse.json(cachedResponse, {
          headers: {
            'X-Cache': 'HIT',
            'X-RateLimit-Limit': String(rateLimiter.maxRequests),
            'X-RateLimit-Remaining': String(rateLimiter.maxRequests - (rateLimiter.requests.get(clientIp)?.count || 0))
          }
        });
      }
    }
    
    // Fetch users directly from MongoDB
    try {
      console.log('Fetching users directly from MongoDB database');
      
      // Connect to environment-aware database
      await getApiDatabase(request);
      
      // Get UserLogins model and build query
      const UserLogins = await getUserLoginsModel();
      const query = { appId };
      if (active !== undefined) {
        query.active = active;
      }
      
      // Fetch users with timeout
      const users = await Promise.race([
        UserLogins.find(query).sort({ createdAt: -1 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 15000)
        )
      ]);
      
      console.log(`Successfully fetched ${users.length} users from database`);
      
      // Format response to match original backend format
      const responseData = { users };
      
      // Cache the response
      responseCache.set(cacheKey, responseData);
      
      // Return the data directly with rate limit headers
      return NextResponse.json(responseData, { 
        headers: {
          'X-Cache': 'MISS',
          'X-RateLimit-Limit': String(rateLimiter.maxRequests),
          'X-RateLimit-Remaining': String(rateLimiter.maxRequests - (rateLimiter.requests.get(clientIp)?.count || 0))
        }
      });
    } catch (error) {
      console.error('Error fetching users from database:', error);
      
      // Special handling for timeouts
      if (error.message === 'Database query timeout') {
        return NextResponse.json({ 
          error: 'Database request timed out, please try again later',
          users: [], 
          pagination: { total: 0, page: 1, limit: 10 }
        }, { status: 504 });
      }
      
      // Return empty data structure with appropriate format
      return NextResponse.json({ 
        users: [], 
        pagination: { total: 0, page: 1, limit: 10 },
        error: `Database error: ${error.message}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users', 
      details: error.message,
      users: [], 
      pagination: { total: 0, page: 1, limit: 10 }
    }, { status: 500 });
  }
}

// POST handler - Create a new user - with or without Firebase authentication
export async function POST(request) {
  try {
    const { email, password, firstName, lastName, appId = '1', active = true } = await request.json();

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    // Create user in Firebase - required for all users
    let firebaseUserId;
    
    // Validate password is required
    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required to create a user' }, 
        { status: 400 }
      );
    }
    
    // Try to create user in Firebase
    if (firebaseAdmin.isAvailable()) {
      const auth = firebaseAdmin.getAuth();
      
      try {
        const firebaseUser = await auth.createUser({
          email,
          password,
          displayName: `${firstName} ${lastName}`,
        });
        firebaseUserId = firebaseUser.uid;
        console.log(`Firebase user created: ${firebaseUserId}`);
      } catch (firebaseError) {
        console.error('Firebase user creation failed:', firebaseError);
        return NextResponse.json(
          { success: false, message: `Firebase user creation failed: ${firebaseError.message}` },
          { status: 400 }
        );
      }
    } else {
      // Firebase not available, return error
      console.error('Firebase is not available but is required for user creation');
      return NextResponse.json(
        { success: false, message: 'Firebase authentication is not available but is required for user creation' },
        { status: 500 }
      );
    }
    
    console.log(`Creating user with ID: ${firebaseUserId}`);

    // Prepare data for backend
    const userLoginData = {
      firebaseUserId,
      appId,
      active,
      localUserInfo: {
        firstName,
        lastName,
        isActive: true,
        isApproved: true,
        isEnabled: true,
      },
      roleIds: [], // Default to no roles
      firebaseUserInfo: {
        email,
        displayName: `${firstName} ${lastName}`,
      }
    };

    // Call backend API to create the user login
    const response = await axios.post(`${BE_URL}/api/userlogins`, userLoginData);

    return NextResponse.json(
      { message: 'User created successfully', ...response.data },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Determine the appropriate error message and status
    let errorMessage = 'Error creating user';
    let statusCode = 500;
    
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email address is already in use';
      statusCode = 409; // Conflict
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
      statusCode = 400; // Bad Request
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak (minimum 6 characters)';
      statusCode = 400; // Bad Request
    } else if (error.response) {
      // If it's an error response from the API call
      errorMessage = error.response.data?.message || errorMessage;
      statusCode = error.response.status || statusCode;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: statusCode }
    );
  }
}

// PATCH handler - Update user
export async function PATCH(request) {
  try {
    const data = await request.json();
    const { firebaseUserId, appId = "1" } = data;
    
    // Forward request to backend
    const response = await axios.put(`${BE_URL}/api/userlogins/updateUserInfo`, data);
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: response.data.updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error.response?.data?.message || error.message 
    }, { status: error.response?.status || 500 });
  }
}