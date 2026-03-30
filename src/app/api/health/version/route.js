import { NextResponse } from 'next/server';
import packageJson from '../../../../../package.json';

/**
 * Health/Version endpoint for deployment monitoring
 * Returns the deployed version of CALOPS
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: packageJson.version,
    name: 'calops',
    description: 'Calendar Operations Dashboard',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}
