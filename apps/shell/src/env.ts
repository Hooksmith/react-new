import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
});

const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me-0123456789";

export const isProd = process.env.NODE_ENV === "production";

let cached: z.infer<typeof EnvSchema> | undefined;

/**
 * Parsed lazily (not at import) so `next build` doesn't need runtime secrets.
 * `instrumentation.ts` calls this at server boot, so a misconfigured pod still fails fast.
 */
export function serverEnv() {
  cached ??= EnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    SESSION_SECRET: process.env.SESSION_SECRET ?? (isProd ? undefined : DEV_FALLBACK_SECRET),
  });
  return cached;
}
