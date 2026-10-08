import type { z } from "zod";

export const CSRF_COOKIE = "nb_csrf";
export const CSRF_HEADER = "x-csrf-token";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export interface RequestOptions<S extends z.ZodType> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Runtime-validates the response so a backend contract change fails loudly, not silently. */
  schema: S;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper used by every zone.
 * - Same-origin only: all zones are served behind one domain, so cookies flow automatically.
 * - Attaches the CSRF double-submit header on mutations.
 * - Parses the response with Zod.
 */
export async function apiFetch<S extends z.ZodType>(
  path: string,
  opts: RequestOptions<S>,
): Promise<z.output<S>> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };

  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers[CSRF_HEADER] = token;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    credentials: "same-origin",
    signal: opts.signal,
  });

  const payload: unknown = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const error = (payload as { error?: { code?: string; message?: string } } | null)?.error;
    if (res.status === 401 && error?.code === "unauthenticated" && typeof window !== "undefined") {
      // Session expired — send the user back to sign in, preserving where they were.
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    }
    throw new ApiError(res.status, error?.message ?? `Request failed (${res.status})`, payload);
  }

  const parsed = opts.schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(500, "Unexpected response from server", parsed.error.issues);
  }
  return parsed.data;
}
