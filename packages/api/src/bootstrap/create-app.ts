import "reflect-metadata";
import compress from "@fastify/compress";
import cookie from "@fastify/cookie";
import { VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";

import type { Env } from "~/shared/infrastructure/config/env";
import { AppErrorFilter } from "~/shared/presentation/http/filters/app-error.filter";
import { StandardSchemaValidationPipe } from "~/shared/presentation/http/pipes/standard-schema-validation.pipe";

import { AppModule } from "./app.module";

export async function createApp(options: {
  env: Env;
}): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.forRoot(options.env),
    new FastifyAdapter(),
  );

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  await app.register(cookie as never);
  await app.register(compress as never);

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
