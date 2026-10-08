/** Runs once when the Next.js server boots — validate config before accepting traffic. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { serverEnv } = await import("./env");
    serverEnv();
  }
}
