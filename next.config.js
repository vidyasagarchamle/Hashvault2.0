/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure for large file uploads
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  images: {
    domains: ['ipfs.io', 'gateway.ipfs.io'],
  },
  // Ensure CSS modules are properly handled
  webpack: (config) => {
    // Add custom webpack configuration if needed
    return config;
  },
  // Enable source maps in production for easier debugging
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig; 