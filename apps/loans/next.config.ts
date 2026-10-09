import os from "node:os";
import path from "node:path";
import type { NextConfig } from "next";

/** This machine's own LAN IPv4 addresses, so `next dev` also works via http://<lan-ip>:3000. */
const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface) => iface?.family === "IPv4" && !iface.internal)
  .map((iface) => iface!.address);

const nextConfig: NextConfig = {
  // Dev-only: Next blocks dev assets/HMR for non-localhost origins, which stops hydration.
  allowedDevOrigins: lanAddresses,
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
