import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: false,
    css: false,
    reporters: "default",
    coverage: {
      provider: "v8",
    },
  },
});
