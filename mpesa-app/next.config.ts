// next.config.js
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
      // Keep your existing patterns
      {
        protocol: 'https',
        hostname: 'grandview-storage.s3.amazonaws.com',
        port: '',
        pathname: '/mpesa_avatars/**',
      },
      {
        protocol: 'https',
        hostname: 'grandview-storage.s3.eu-north-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // ... others
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
    ],

    // ← ADD THIS (most important line)
    unoptimized: true,   // Disables Next.js Image optimization entirely → no upstream fetch, no private IP error
  },
};

module.exports = withPWA(nextConfig);