import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Allow up to 500MB for video uploads
    },
  },
  // The legacy `api` config key is no longer supported in Next.js 15.
  // Route handlers will inherit the `serverActions.bodySizeLimit` instead.
};

export default nextConfig;
