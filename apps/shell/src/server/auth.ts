import "server-only";
import { SESSION_COOKIE, verifySessionToken, type Session } from "@nexbank/security";
import { cookies } from "next/headers";
import { cache } from "react";
import { z } from "zod";
import { serverEnv } from "@/env";
import usersJson from "./data/users.json";

/**
 * Demo staff directory, loaded from `data/users.json`. Both accounts use the password
 * "Password123!". `passwordSha256` is demo-only — production would use an IdP (OIDC) or argon2.
 */
const StaffUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  role: z.enum(["loan_officer", "credit_analyst", "admin"]),
  passwordSha256: z.string().regex(/^[0-9a-f]{64}$/),
});
type StaffUser = z.infer<typeof StaffUserSchema>;

const USERS: StaffUser[] = z.array(StaffUserSchema).parse(usersJson);

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function authenticate(username: string, password: string): Promise<StaffUser | null> {
  const user = USERS.find((u) => u.username === username);
  // Always hash, even for unknown users, so response time doesn't reveal which usernames exist.
  const hash = await sha256Hex(password);
  if (!user || hash !== user.passwordSha256) return null;
  return user;
}

/** Request-scoped (deduped with React `cache`) session lookup for RSCs and route handlers. */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, serverEnv().SESSION_SECRET);
});

/**
 * Fixed-window throttle on *failed* sign-ins per client key (IP). In-memory for the demo —
 * use Redis (or the API gateway) when running multiple replicas.
 */
const failures = new Map<string, { count: number; resetAt: number }>();
const MAX_FAILURES = 5;
const WINDOW_MS = 60_000;

export function loginRetryAfter(key: string, now = Date.now()): number {
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= now || entry.count < MAX_FAILURES) return 0;
  return Math.ceil((entry.resetAt - now) / 1000);
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const entry = failures.get(key);
  if (!entry || entry.resetAt <= now) failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}

export function clearLoginFailures(key: string) {
  failures.delete(key);
}
