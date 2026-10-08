import { LoginSchema } from "@nexbank/api";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@nexbank/security";
import { NextResponse } from "next/server";
import { isProd, serverEnv } from "@/env";
import {
  authenticate,
  clearLoginFailures,
  loginRetryAfter,
  recordLoginFailure,
} from "@/server/auth";
import { jsonError, parseBody } from "@/server/http";

export async function POST(req: Request) {
  const clientKey = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const retryAfter = loginRetryAfter(clientKey);
  if (retryAfter > 0) {
    const res = jsonError(429, "rate_limited", "Too many sign-in attempts. Try again shortly.");
    res.headers.set("Retry-After", String(retryAfter));
    return res;
  }

  const { data, error } = await parseBody(req, LoginSchema);
  if (error) return error;

  const user = await authenticate(data.username, data.password);
  // Generic message: don't reveal whether the username or the password was wrong.
  if (!user) {
    recordLoginFailure(clientKey);
    return jsonError(401, "invalid_credentials", "Incorrect username or password");
  }

  clearLoginFailures(clientKey);
  const token = await createSessionToken(
    { sub: user.id, name: user.name, role: user.role },
    serverEnv().SESSION_SECRET,
  );
  const res = NextResponse.json({ id: user.id, name: user.name, role: user.role });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(isProd));
  return res;
}
