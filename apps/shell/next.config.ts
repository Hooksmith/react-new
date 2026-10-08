import path from "node:path";
import type { NextConfig } from "next";

const LOANS_ZONE_URL = process.env.LOANS_ZONE_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Self-contained server bundle for small Docker images.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  poweredByHeader: false,
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ["@nexbank/ui", "@nexbank/api", "@nexbank/security"],
  experimental: {
    optimizePackageImports: ["recharts"],
  },

  /**
   * Next.js Multi-Zones: this "shell" zone owns `/`, `/analytics`, `/login` and the BFF `/api/*`.
   * Everything under `/loans` is served by the separately built & deployed loans zone.
   */
  async rewrites() {
    return [
      { source: "/loans", destination: `${LOANS_ZONE_URL}/loans` },
      { source: "/loans/:path+", destination: `${LOANS_ZONE_URL}/loans/:path+` },
    ];
  },
};

export default nextConfig;
