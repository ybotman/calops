import { NextResponse } from 'next/server';

export function middleware() {
  // Temporarily disable all authentication checks
  // All routes are now publicly accessible
  // This will be replaced with Firebase RBAC in the future
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|api/webhooks|favicon.ico).*)'],
};