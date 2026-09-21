import path from "node:path";

import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    printWidth: 80,
    jsdoc: false,
    ignorePatterns: [
      "clean-architecture-guide.md",
      "apps/web/src/routeTree.gen.ts",
      "tools/oxlint/anti-slop/**",
    ],
  },
  lint: {
    plugins: ["typescript"],
    ignorePatterns: ["tools/oxlint/anti-slop/**"],
    jsPlugins: [
      {
        name: "anti-slop",
        specifier: "./tools/oxlint/anti-slop/index.ts",
      },
      {
        name: "anti-slop-effect",
        specifier: "./tools/oxlint/anti-slop/effect/index.ts",
      },
      {
        name: "comment-reflow",
        specifier: "oxlint-plugin-comment-reflow",
      },
    ],
    rules: {
      "anti-slop/organize-imports": "error",
      "oxc/no-accumulating-spread": "error",
      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-illegal-layer-imports": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-runtime-typeof": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-readable-spacing": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
      "anti-slop-effect/no-manual-effect-error-tag": "error",
      "anti-slop-effect/no-manual-tag-comparison": "error",
      "anti-slop-effect/no-manual-tagged-construction": "error",
      "anti-slop-effect/no-service-constructor-imports": "error",
      "anti-slop-effect/prefer-effect-match": "error",
      "comment-reflow/reflow": [
        "warn",
        { printWidth: 80, trailingComments: "overflow" },
      ],
    },
    overrides: [
      { files: ["apps/web/**", "packages/ui/**"], plugins: ["react"] },
      {
        files: ["apps/web/src/routeTree.gen.ts"],
        rules: { "anti-slop/organize-imports": "off" },
      },
      {
        files: ["packages/api/**"],
        plugins: ["import"],
        rules: { "import/no-relative-parent-imports": "error" },
      },
    ],
  },
  test: {
    // `vp test` runs vitest with this root config only; maps packages/api's
    // `~` tsconfig alias. Scope per-package if web tests ever run under vp.
    alias: {
      "~": path.resolve(import.meta.dirname, "packages/api/src"),
    },
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  staged: {
    "*.{js,mjs,cjs,ts,tsx,jsx}": ["vp fmt --write", "vp lint --fix"],
    "*.{json,jsonc,md,yml,yaml,css,html}": "vp fmt --write",
  },
});
