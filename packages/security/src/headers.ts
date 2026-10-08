import { base64UrlEncode } from "./encoding";

export function generateNonce(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * Strict, nonce-based Content Security Policy.
 * `strict-dynamic` lets Next.js' nonce'd bootstrap script load its chunks while blocking any
 * injected <script> without the per-request nonce.
 */
export function buildCsp(nonce: string, { isDev }: { isDev: boolean }): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // Chart libraries set inline style attributes; styles can't execute code.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:"],
    "font-src": ["'self'"],
    "connect-src": ["'self'", ...(isDev ? ["ws:"] : [])],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
  };
  return Object.entries(directives)
    .map(([key, values]) => [key, ...values].join(" "))
    .join("; ");
}

/** Static security headers applied to every response. */
export const securityHeaders: Record<string, string> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

/**
 * The origin as the *browser* sees it. Behind a TLS-terminating ingress (or the shell zone's
 * rewrite proxy) the request URL is the internal one, so prefer the X-Forwarded-* headers.
 * The edge (ingress) must overwrite — not pass through — client-supplied X-Forwarded-* values.
 */
export function publicOrigin(headers: Headers, requestUrl: string): string {
  const url = new URL(requestUrl);
  const proto =
    headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? url.protocol.replace(":", "");
  const host =
    headers.get("x-forwarded-host")?.split(",")[0]?.trim() ?? headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}
