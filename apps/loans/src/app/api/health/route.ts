import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Served at /loans/api/health (basePath). Used by Kubernetes probes. */
export function GET() {
  return NextResponse.json({ status: "ok", zone: "loans", uptime: process.uptime() });
}
