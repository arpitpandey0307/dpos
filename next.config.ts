import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Docker / serverless compatibility
  output: "standalone",

  // Disable x-powered-by header
  poweredByHeader: false,

  // Allow Vercel image optimization
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
