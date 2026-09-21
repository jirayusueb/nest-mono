import { RuleTester } from "oxlint/plugins-dev";

import { organizeImportsRule } from "./organize-imports.ts";

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } });
const error = { messageId: "notOrganized" };

tester.run("anti-slop/organize-imports", organizeImportsRule, {
  valid: [
    'import { a } from "a";',
    'import path from "node:path";\n\nimport { defineConfig } from "vite-plus";',
    'import "reflect-metadata";\nimport { NestFactory } from "@nestjs/core";',
    'import { x } from "~/shared/x";\n\nimport { y } from "./y";',
    'import { api } from "@nest-mono/api";\n\nimport { x } from "~/x";\n\nimport { y } from "./y";',
  ],
  invalid: [
    {
      code: 'import { b } from "b";\nimport { a } from "a";',
      output: 'import { a } from "a";\nimport { b } from "b";',
      errors: [error],
    },
    {
      code: 'import { y } from "./y";\n\nimport { a } from "a";',
      output: 'import { a } from "a";\n\nimport { y } from "./y";',
      errors: [error],
    },
    {
      code: 'import { a } from "a";\n\nimport { b } from "b";',
      output: 'import { a } from "a";\nimport { b } from "b";',
      errors: [error],
    },
    {
      code: 'import { y } from "./y";\nimport { x } from "~/x";',
      output: 'import { x } from "~/x";\n\nimport { y } from "./y";',
      errors: [error],
    },
    {
      code: 'import "reflect-metadata";\nimport { b } from "b";\nimport { a } from "a";',
      output: 'import "reflect-metadata";\nimport { a } from "a";\nimport { b } from "b";',
      errors: [error],
    },
    {
      code: 'import { z } from "./z";\n// pinned to react\nimport react from "react";\nimport { a } from "a";',
      output: 'import { a } from "a";\n// pinned to react\nimport react from "react";\n\nimport { z } from "./z";',
      errors: [error],
    },
  ],
});
