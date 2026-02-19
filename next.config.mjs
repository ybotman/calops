import { readFileSync } from 'fs';

// Read version from package.json at build time
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// Build timestamp
const buildTime = new Date().toISOString();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_APP_NAME: packageJson.name,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
  async rewrites() {
    // Primary: Azure Functions backend (calendar-be-af)
    // Fallback: Legacy Express backend (calendar-be) - DEPRECATED
    const afEnabled = process.env.NEXT_PUBLIC_AF_ENABLED === 'true';
    const backendUrl = afEnabled
      ? (process.env.NEXT_PUBLIC_AF_URL || 'http://localhost:7071')
      : (process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:3010');

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
