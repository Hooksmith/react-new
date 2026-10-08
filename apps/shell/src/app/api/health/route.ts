import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness/readiness probe target for Kubernetes. */
export function GET() {
  return NextResponse.json({ status: "ok", zone: "shell", uptime: process.uptime() });
}
