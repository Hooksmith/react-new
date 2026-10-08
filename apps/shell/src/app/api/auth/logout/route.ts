import { SESSION_COOKIE } from "@nexbank/security";
import { NextResponse } from "next/server";

export async function POST() {
  // 303 so the browser follows with GET; relative Location stays correct behind an ingress.
  const res = new NextResponse(null, { status: 303, headers: { Location: "/login" } });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
