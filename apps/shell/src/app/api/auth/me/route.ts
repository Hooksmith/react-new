import { NextResponse } from "next/server";
import { withSession } from "@/server/http";

export const GET = withSession(async (_req, { session }) =>
  NextResponse.json({ id: session.sub, name: session.name, role: session.role }),
);
