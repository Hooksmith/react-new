// Shared Vitest defaults so every workspace reports coverage the same way.
export const sharedTestConfig = {
  globals: true,
  css: false,
  coverage: {
    provider: "v8",
    reporter: ["text", "lcov"],
    exclude: ["**/*.config.*", "**/.next/**", "**/*.d.ts", "**/test/**"],
  },
};
