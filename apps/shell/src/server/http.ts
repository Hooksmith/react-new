import "server-only";
import type { Session } from "@nexbank/security";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { getSession } from "./auth";

export function jsonError(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

/** Parses an untrusted JSON body against a schema. Never trust the client — re-validate server-side. */
export async function parseBody<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<{ data: z.output<S>; error?: never } | { data?: never; error: NextResponse }> {
  const raw: unknown = await req.json().catch(() => undefined);
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      error: jsonError(
        422,
        "validation_failed",
        "Request validation failed",
        result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      ),
    };
  }
  return { data: result.data };
}

type Handler<C> = (req: Request, ctx: C & { session: Session }) => Promise<Response>;

/**
 * Wraps a route handler with an authoritative session check. The proxy also guards `/api`,
 * but authorisation must live next to the data access — proxies can be bypassed or misconfigured.
 */
export function withSession<C>(handler: Handler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    const session = await getSession();
    if (!session) return jsonError(401, "unauthenticated", "Sign in required");
    try {
      return await handler(req, { ...ctx, session });
    } catch (err) {
      console.error("[api] unhandled error", err);
      // Don't leak internals (stack traces, SQL, upstream errors) to the client.
      return jsonError(500, "internal_error", "An unexpected error occurred");
    }
  };
}
