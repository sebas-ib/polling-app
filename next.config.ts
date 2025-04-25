// next.config.ts

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    PUBLIC_API_URL: process.env.PUBLIC_API_URL!,
  },
}

export default nextConfig
