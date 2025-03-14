/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure for large file uploads
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  // Increase API body size limit to handle large file uploads
  api: {
    bodyParser: {
      sizeLimit: '500mb', // Set to match the free storage limit
    },
    responseLimit: '500mb',
  },
};

module.exports = nextConfig; 