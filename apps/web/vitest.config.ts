import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(import.meta.dirname, "src"),
    },
  },
  esbuild: { jsx: "automatic" },
  test: {
    environment: "happy-dom",
    setupFiles: [path.resolve(import.meta.dirname, "vitest.setup.ts")],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Gate the logic layer; routes/pages/app-shell are thin TanStack glue
      // exercised via e2e, intentionally outside the unit gate.
      include: [
        "src/shared/api/**",
        "src/shared/config/**",
        "src/shared/auth/**",
        "src/entities/**",
        "src/features/manage-posts/api/**",
      ],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/shared/api/index.ts",
        "src/shared/config/index.ts",
        "src/shared/api/post.ts",
        "src/shared/api/user.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});