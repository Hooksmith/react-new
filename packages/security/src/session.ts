import { base64UrlDecode, base64UrlEncode, timingSafeEqual } from "./encoding";

export const SESSION_COOKIE = "nb_session";
export const SESSION_TTL_SECONDS = 60 * 30; // 30 min idle timeout, typical for banking apps

export type Role = "loan_officer" | "credit_analyst" | "admin";

export interface Session {
  sub: string;
  name: string;
  role: Role;
  /** Expiry, seconds since epoch */
  exp: number;
}

const encoder = new TextEncoder();

async function hmacKey(secret: string): Promise<CryptoKey> {
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(data: string, secret: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}

/** Produces `<payload>.<signature>`; a stateless, tamper-evident session token. */
export async function createSessionToken(
  session: Omit<Session, "exp">,
  secret: string,
  now = Date.now(),
): Promise<string> {
  const payload: Session = { ...session, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS };
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await sign(body, secret)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): Promise<Session | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = await sign(body, secret);
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as Session;
    if (typeof session.exp !== "number" || session.exp * 1000 <= now) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true, // not readable from JS → session can't be exfiltrated via XSS
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
