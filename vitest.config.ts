import path from "path";
import { defineConfig } from "vitest/config";

// Unit tests cover pure logic in src/lib; components are verified by typecheck, lint, build and screenshots.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
