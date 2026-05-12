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
  async redirects() {
    return [
      // CALOPS-57: /dashboard/user-logins moved under USER ACTIVITY (Login).
      // Server-level redirect — fires at the Next.js routing layer before any
      // edge cache lookup, guarantees old bookmarks bounce regardless of
      // cached page state.
      {
        source: '/dashboard/user-logins',
        destination: '/dashboard/analytics/logins',
        permanent: true,
      },
    ];
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
        // Exclude /api/analytics/* and /api/ops/* - handled by Next.js API routes with function key
        source: '/api/((?!analytics|ops).*)',
        destination: `${backendUrl}/api/$1`,
      },
    ];
  },
};

export default nextConfig;
