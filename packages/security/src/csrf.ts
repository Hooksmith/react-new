import { randomToken, timingSafeEqual } from "./encoding";

/**
 * Double-submit cookie CSRF protection.
 * The proxy issues a random token in a JS-readable cookie; the client echoes it in a header
 * on every state-changing request. A cross-site attacker can make the browser *send* the
 * cookie but cannot *read* it, so it cannot forge the matching header.
 */
export const CSRF_COOKIE = "nb_csrf";
export const CSRF_HEADER = "x-csrf-token";

export const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function generateCsrfToken(): string {
  return randomToken(32);
}

export function csrfCookieOptions(secure: boolean) {
  return {
    httpOnly: false, // must be readable by our own JS to echo it back
    secure,
    sameSite: "strict" as const,
    path: "/",
  };
}

export interface CsrfCheckInput {
  method: string;
  cookieToken: string | undefined;
  headerToken: string | null;
  origin: string | null;
  allowedOrigins: string[];
}

export type CsrfResult = { ok: true } | { ok: false; reason: string };

export function verifyCsrf(input: CsrfCheckInput): CsrfResult {
  if (SAFE_METHODS.has(input.method.toUpperCase())) return { ok: true };

  // Defence in depth: reject cross-origin requests outright when the browser tells us the origin.
  if (input.origin && !input.allowedOrigins.includes(input.origin)) {
    return { ok: false, reason: "origin_mismatch" };
  }
  if (!input.cookieToken || !input.headerToken) return { ok: false, reason: "token_missing" };
  if (!timingSafeEqual(input.cookieToken, input.headerToken)) {
    return { ok: false, reason: "token_mismatch" };
  }
  return { ok: true };
}
