import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: [
    "@mooch/ui",
    "@mooch/db",
    "@mooch/types",
    "@mooch/stores",
  ],
};

export default nextConfig;
