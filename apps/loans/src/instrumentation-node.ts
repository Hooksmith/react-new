// The loans zone verifies the shared session cookie, so it needs the same secret as the shell.
// Crash at boot (rather than 500 on every request) when it's missing or weak in production.
const secret = process.env.SESSION_SECRET;

if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
  console.error(
    "[startup] SESSION_SECRET must be set to at least 32 characters — refusing to start",
  );
  process.exit(1);
}
export {};
