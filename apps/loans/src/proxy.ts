import {
  buildCsp,
  generateNonce,
  publicOrigin,
  securityHeaders,
  SESSION_COOKIE,
  verifySessionToken,
} from "@nexbank/security";
import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? (isDev ? "dev-only-insecure-secret-change-me-0123456789" : "");

/**
 * Each zone is independently deployable, so each enforces auth itself (zero-trust between
 * zones) rather than assuming the shell already checked. The session cookie is shared because
 * every zone is served from the same origin.
 */
export async function proxy(req: NextRequest) {
  // req.nextUrl.pathname excludes the basePath.
  if (req.nextUrl.pathname === "/api/health") return NextResponse.next();

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, SESSION_SECRET);
  if (!session) {
    // Absolute URL on the *public* origin (not this zone's internal host).
    const login = new URL("/login", publicOrigin(req.headers, req.url));
    login.searchParams.set(
      "next",
      `/loans${req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname}`,
    );
    return NextResponse.redirect(login);
  }

  const nonce = generateNonce();
  const csp = buildCsp(nonce, { isDev });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  for (const [name, value] of Object.entries(securityHeaders)) response.headers.set(name, value);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
