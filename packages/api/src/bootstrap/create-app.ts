import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import { AppErrorFilter } from "../shared/presentation/http/app-error.filter";
import { StandardSchemaValidationPipe } from "../shared/presentation/http/standard-schema-validation-pipe";
import { AppModule } from "./app.module";

export async function createApp(options: {
  webOrigin: string;
}): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // SAFETY: @fastify/cookie types target raw Fastify; Nest's register shim only
  // accepts never here.
  await app.register(cookie as never);
  app.useGlobalFilters(new AppErrorFilter());
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableCors({
    origin: options.webOrigin,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  });
  await app.init();

  return app;
}
