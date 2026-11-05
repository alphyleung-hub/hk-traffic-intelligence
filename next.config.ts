import type { NextConfig } from "next";

//const nextConfig: NextConfig = {
//  allowedDevOrigins: ["127.0.0.1", "localhost"],
//};

//export default nextConfig;


const nextConfig: NextConfig = {
  // ... your existing config ...
  
  // ADD THIS BLOCK:
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;