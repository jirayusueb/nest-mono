import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import { AppErrorFilter } from "../shared/presentation/http/app-error.filter";
import { StandardSchemaValidationPipe } from "../shared/presentation/http/standard-schema-validation.pipe";
import type { Env } from "../shared/infrastructure/config/env";
import { AppModule } from "./app.module";

export async function createApp(options: {
  env: Env;
}): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.forRoot(options.env),
    new FastifyAdapter(),
  );

  // SAFETY: @fastify/cookie types target raw Fastify; Nest's register shim only
  // accepts never here.
  await app.register(cookie as never);
  app.useGlobalFilters(app.get(AppErrorFilter));
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableCors({
    origin: options.env.WEB_ORIGIN,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  });
  await app.init();

  return app;
}
