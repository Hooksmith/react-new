import { serverEnv } from "./env";

try {
  serverEnv();
} catch (err) {
  // Next.js only logs instrumentation errors and keeps serving; a misconfigured pod must instead
  // crash so Kubernetes/compose reports it and never routes traffic to it.
  console.error("[startup] invalid server configuration — refusing to start\n", err);
  process.exit(1);
}
