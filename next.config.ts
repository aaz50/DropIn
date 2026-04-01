import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep xrpl (and its Node.js WebSocket deps) server-side only.
  // Without this, Next.js tries to bundle it for the browser and fails.
  serverExternalPackages: ["xrpl"],
};

export default nextConfig;
