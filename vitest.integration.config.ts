// Vitest configuration for integration tests.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.integration.ts"],
    passWithNoTests: true,
  },
});
