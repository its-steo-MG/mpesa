// next.config.ts  ← For your separate M-Pesa PWA app
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
      // Main S3 bucket - allow ALL paths (this covers robots, mpesa_avatars, etc.)
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
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
    ],
    unoptimized: true,   // Keep this while testing S3
  },
};

module.exports = withPWA(nextConfig);