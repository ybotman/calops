/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,

  // Webpack configuration for custom logging
  webpack: (config, { buildId, dev, isServer }) => {
    // Log environment variables in development
    if (dev) {
      console.log('NEXT_PUBLIC_BE_URL:', process.env.NEXT_PUBLIC_BE_URL);
      console.log('Build ID:', buildId);
      console.log('Development Mode:', dev);
      console.log('Server Build:', isServer);
    }

    return config;
  },

  // Add rewrites to proxy API requests to the backend server
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_BE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;