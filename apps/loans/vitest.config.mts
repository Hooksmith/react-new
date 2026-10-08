import { sharedTestConfig } from "@nexbank/config/vitest";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `server-only` throws when imported outside RSC; neutralise it for unit tests.
      "server-only": path.resolve(import.meta.dirname, "test/empty.ts"),
    },
  },
  test: { ...sharedTestConfig, environment: "jsdom", setupFiles: ["./test/setup.ts"] },
});
