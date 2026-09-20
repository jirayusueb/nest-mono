import "reflect-metadata";
import "zod/compile";
import {
  createApp,
  ensureBucket,
  loadEnv,
  runMigrations,
} from "@nest-mono/api";

const env = loadEnv();

await runMigrations(env.DATABASE_URL);

await ensureBucket(env);

const app = await createApp({ env });

await app.listen({ port: env.PORT, host: "0.0.0.0" });

console.log(`api listening on :${env.PORT}`);
