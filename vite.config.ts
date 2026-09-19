import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    printWidth: 80,
    jsdoc: false, // comment-reflow owns comment/JSDoc prose wrapping
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
      "oxc/no-accumulating-spread": "error",
      // anti-slop (generic)
      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
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
      // anti-slop (Effect; repo uses effect via packages/infra + alchemy)
      "anti-slop-effect/no-manual-effect-error-tag": "error",
      "anti-slop-effect/no-manual-tag-comparison": "error",
      "anti-slop-effect/no-manual-tagged-construction": "error",
      "anti-slop-effect/no-service-constructor-imports": "error",
      "anti-slop-effect/prefer-effect-match": "error",
      // comment-reflow: warn per upstream recommended config
      "comment-reflow/reflow": [
        "warn",
        { printWidth: 80, trailingComments: "overflow" },
      ],
    },
    overrides: [
      { files: ["apps/web/**", "packages/ui/**"], plugins: ["react"] },
    ],
  },
  staged: {
    "*.{js,mjs,cjs,ts,tsx,jsx}": ["vp fmt --write", "vp lint --fix"],
    "*.{json,jsonc,md,yml,yaml,css,html}": "vp fmt --write",
  },
});
