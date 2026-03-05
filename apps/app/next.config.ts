import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  transpilePackages: [
    "@mooch/ui",
    "@mooch/db",
    "@mooch/types",
    "@mooch/stores",
  ],
  // Allow ngrok tunnels for mobile testing
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io"],
};

export default nextConfig;
