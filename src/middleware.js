import { NextResponse } from 'next/server';

// Define paths that are public and don't need authentication
const publicPaths = [
  '/login',
  '/api/auth/verify-password',
  '/CalOpsIcon.png',
  '/CalOpsWide.png',
  '/_next',
  '/favicon.ico'
];

// Check if a path is public
const isPublicPath = (path) => {
  return publicPaths.some(prefix => path.startsWith(prefix));
};

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Skip auth check for public paths
  if (isPublicPath(path)) {
    return NextResponse.next();
  }
  
  // Check for auth cookie
  const authToken = request.cookies.get('auth_token')?.value;
  
  if (!authToken) {
    // Redirect to login if no auth token
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/webhooks|favicon.ico).*)'],
};