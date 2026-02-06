/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
