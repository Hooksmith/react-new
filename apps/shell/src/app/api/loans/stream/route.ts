import { getSession } from "@/server/auth";
import { subscribe } from "@/server/events";
import { jsonError } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream of loan status changes.
 * SSE (vs WebSockets) is one-directional, works over plain HTTP/2 through ingresses and proxies,
 * and the browser's EventSource reconnects automatically.
 */
export async function GET(req: Request) {
  if (!(await getSession())) return jsonError(401, "unauthenticated", "Sign in required");

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));
      send("retry: 5000\n\n");

      const unsubscribe = subscribe((event) =>
        send(`id: ${event.id}\nevent: loan\ndata: ${JSON.stringify(event)}\n\n`),
      );
      // Comment frames keep idle connections alive through load balancers.
      const heartbeat = setInterval(() => send(": ping\n\n"), 15_000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        controller.close();
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disable nginx-ingress buffering
    },
  });
}
