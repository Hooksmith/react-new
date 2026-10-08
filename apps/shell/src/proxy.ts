import {
  buildCsp,
  CSRF_COOKIE,
  CSRF_HEADER,
  csrfCookieOptions,
  generateCsrfToken,
  generateNonce,
  publicOrigin,
  securityHeaders,
  SESSION_COOKIE,
  verifyCsrf,
  verifySessionToken,
} from "@nexbank/security";
import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? (isDev ? "dev-only-insecure-secret-change-me-0123456789" : "");

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/api/health"]);

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/**
 * Edge gatekeeper for the shell zone (Next.js 16 `proxy`, formerly `middleware`):
 *  1. Auth guard for pages and the BFF (route handlers re-check — never rely on proxy alone).
 *  2. CSRF verification for state-changing API calls.
 *  3. Per-request CSP nonce.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isLoansZone = pathname === "/loans" || pathname.startsWith("/loans/");

  // Static assets of the loans zone are public and carry their own headers.
  if (pathname.startsWith("/loans/_next/")) return NextResponse.next();

  const origin = publicOrigin(req.headers, req.url);

  // 1. Authentication
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, SESSION_SECRET);
  if (!session && !PUBLIC_PATHS.has(pathname)) {
    if (isApi) return jsonError(401, "unauthenticated", "Sign in required");
    const url = new URL("/login", origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (session && pathname === "/login") return NextResponse.redirect(new URL("/", origin));

  // 2. CSRF
  if (isApi) {
    const isFormLogout = pathname === "/api/auth/logout";
    const result = isFormLogout
      ? // Plain <form> POST can't send custom headers; require a same-origin Origin header instead.
        req.headers.get("origin") === origin
        ? { ok: true as const }
        : { ok: false as const, reason: "origin_mismatch" }
      : verifyCsrf({
          method: req.method,
          cookieToken: req.cookies.get(CSRF_COOKIE)?.value,
          headerToken: req.headers.get(CSRF_HEADER),
          origin: req.headers.get("origin"),
          allowedOrigins: [origin],
        });
    if (!result.ok)
      return jsonError(403, "csrf_failed", `CSRF validation failed (${result.reason})`);
  }

  // 3. CSP — the loans zone sets its own policy (with its own nonce), so don't add a second one.
  let response: NextResponse;
  if (isLoansZone || isApi) {
    response = NextResponse.next();
  } else {
    const nonce = generateNonce();
    const csp = buildCsp(nonce, { isDev });
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);
    // Next.js reads the nonce from this request header and stamps it on its own <script> tags.
    requestHeaders.set("Content-Security-Policy", csp);
    response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
  }
  if (!isLoansZone) {
    for (const [name, value] of Object.entries(securityHeaders)) response.headers.set(name, value);
  }

  if (!req.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, generateCsrfToken(), csrfCookieOptions(!isDev));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
