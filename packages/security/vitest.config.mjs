import { sharedTestConfig } from "@nexbank/config/vitest";
import { defineConfig } from "vitest/config";

export default defineConfig({ test: { ...sharedTestConfig, environment: "node" } });
