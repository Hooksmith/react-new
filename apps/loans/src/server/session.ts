import "server-only";
import { SESSION_COOKIE, verifySessionToken } from "@nexbank/security";
import { cookies } from "next/headers";
import { cache } from "react";

const SESSION_SECRET =
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === "production" ? "" : "dev-only-insecure-secret-change-me-0123456789");

export const getSession = cache(async () => {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value, SESSION_SECRET);
});
