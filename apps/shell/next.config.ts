import os from "node:os";
import path from "node:path";
import type { NextConfig } from "next";

const LOANS_ZONE_URL = process.env.LOANS_ZONE_URL ?? "http://localhost:3001";

/** This machine's own LAN IPv4 addresses, so `next dev` also works via http://<lan-ip>:3000. */
const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface) => iface?.family === "IPv4" && !iface.internal)
  .map((iface) => iface!.address);

const nextConfig: NextConfig = {
  // Dev-only: Next blocks dev assets/HMR for non-localhost origins, which stops hydration.
  allowedDevOrigins: lanAddresses,
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
