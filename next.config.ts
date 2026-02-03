import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone build for Docker deployment
  output: 'standalone',

  // Enable image optimization for WordPress images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
      {
        protocol: 'https',
        hostname: '**.wordpress.com',
      },
      {
        // Add your WordPress domain here
        // Replace with your actual WordPress domain
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_WORDPRESS_URL
          ? new URL(process.env.NEXT_PUBLIC_WORDPRESS_URL).hostname
          : 'localhost',
      },
      {
        // For local development
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Image formats to use
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_WORDPRESS_URL: process.env.NEXT_PUBLIC_WORDPRESS_URL,
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Strict mode for better development
  reactStrictMode: true,

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
