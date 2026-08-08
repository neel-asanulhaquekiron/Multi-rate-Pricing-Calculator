import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/test/setup.ts"],
    // Tests hit the real database — run files serially to avoid races.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
