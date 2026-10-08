import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Multi-zone child app: every route and asset lives under /loans so the shell zone can proxy
   * `/loans/*` here without path collisions (`/loans/_next/...` vs the shell's `/_next/...`).
   */
  basePath: "/loans",
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["@nexbank/ui", "@nexbank/api", "@nexbank/security"],
};

export default nextConfig;
