import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["defuddle", "jsdom"],
};

export default nextConfig;
