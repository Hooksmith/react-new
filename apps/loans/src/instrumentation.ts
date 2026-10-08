/** Runs once when the Next.js server boots — validate config before accepting traffic. */
export async function register() {
  // Node-only module, so `process.exit` never ends up in an Edge bundle.
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
