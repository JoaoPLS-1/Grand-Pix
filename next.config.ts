import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  reactStrictMode: false,
  experimental: {
    webpackMemoryOptimizations: true,
  },
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
