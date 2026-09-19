import "reflect-metadata";
import "zod/compile";
import { createApp, ensureBucket, runMigrations } from "@nest-mono/api";
import { loadEnv } from "./env";

const env = loadEnv();

await runMigrations();

await ensureBucket();

const app = await createApp({ webOrigin: env.WEB_ORIGIN });

await app.listen({ port: env.PORT, host: "0.0.0.0" });

console.log(`api listening on :${env.PORT}`);
