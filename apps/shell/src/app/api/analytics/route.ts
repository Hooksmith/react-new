import { NextResponse } from "next/server";
import { getAnalytics } from "@/server/db";
import { withSession } from "@/server/http";

export const GET = withSession(async () =>
  NextResponse.json(getAnalytics(), { headers: { "Cache-Control": "private, max-age=30" } }),
);
