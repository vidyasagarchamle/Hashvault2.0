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
  }
};

module.exports = nextConfig; 