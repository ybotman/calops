import { NextResponse } from 'next/server';
import packageJson from '../../../../package.json';

export async function GET() {
  return NextResponse.json({
    version: packageJson.version,
    name: 'calops',
    platform: 'vercel',
    timestamp: new Date().toISOString()
  });
}
