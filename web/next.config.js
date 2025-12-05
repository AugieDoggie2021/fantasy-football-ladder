/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Speed up Vercel builds by skipping lint/type-check during build
  // Lint and type-check should be run locally or in CI, not during Vercel deployments
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig

