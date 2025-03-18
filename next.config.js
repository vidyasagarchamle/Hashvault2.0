/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure for large file uploads
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  // Set body parser size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Limit for chunk uploads
    },
    responseLimit: false,
  },
  // Note: The api.bodyParser config is used by Next.js to limit request sizes
};

module.exports = nextConfig; 