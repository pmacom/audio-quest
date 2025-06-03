import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb', // Allow up to 500MB for video uploads
    },
  },
  // Increase the API body size limit
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

export default nextConfig;
