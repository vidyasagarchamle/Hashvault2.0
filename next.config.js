/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure for large file uploads
  experimental: {
    serverComponentsExternalPackages: ['formidable'],
  },
  // Note: The api.bodyParser config is no longer needed in Next.js App Router
  // Instead, we use route segment config exports in each route.ts file
};

module.exports = nextConfig; 