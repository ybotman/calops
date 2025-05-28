import { NextResponse } from 'next/server';
import axios from 'axios';
import firebaseAdmin from '@/lib/firebase-admin'; // Import the improved firebase admin object

const BE_URL = process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010';

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
   * Clean up old cache entries
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
    
    // Fetch users from backend
    try {
      console.log('Fetching users with backend API at /api/userlogins/all');
      
      // Add timeout to prevent hanging requests
      const response = await axios.get(`${BE_URL}/api/userlogins/all?${queryString}`, {
        timeout: 15000 // 15 second timeout
      });
      
      console.log(`Successfully fetched ${response.data?.users?.length || 0} users from backend`);
      
      // Cache the response
      responseCache.set(cacheKey, response.data);
      
      // Return the data directly with rate limit headers
      return NextResponse.json(response.data, { 
        headers: {
          'X-Cache': 'MISS',
          'X-RateLimit-Limit': String(rateLimiter.maxRequests),
          'X-RateLimit-Remaining': String(rateLimiter.maxRequests - (rateLimiter.requests.get(clientIp)?.count || 0))
        }
      });
    } catch (error) {
      console.error('Error fetching users from backend:', error);
      
      // Special handling for timeouts and rate limits
      if (error.code === 'ECONNABORTED' || (error.response && error.response.status === 504)) {
        return NextResponse.json({ 
          error: 'Backend request timed out, please try again later',
          users: [], 
          pagination: { total: 0, page: 1, limit: 10 }
        }, { status: 504 });
      }
      
      if (error.response && error.response.status === 429) {
        return NextResponse.json({ 
          error: 'Backend rate limited, please try again later',
          users: [], 
          pagination: { total: 0, page: 1, limit: 10 }
        }, { 
          status: 429,
          headers: {
            'Retry-After': error.response.headers['retry-after'] || '60'
          }
        });
      }
      
      // Return empty data structure with appropriate format
      return NextResponse.json({ 
        users: [], 
        pagination: { total: 0, page: 1, limit: 10 },
        error: `Backend API error: ${error.message}`
      }, { status: error.response?.status || 500 });
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