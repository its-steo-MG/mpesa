// next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      // S3 buckets
      {
        protocol: 'https',
        hostname: 'grandview-storage.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'grandview-storage.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
      // Local backend during development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',           // ← Change if your backend runs on different port
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
    ],
    unoptimized: true,   // Keep this for now (recommended while testing S3 + localhost)
  },
};

module.exports = withPWA(nextConfig);