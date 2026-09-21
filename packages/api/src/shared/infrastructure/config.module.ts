import { type DynamicModule, Global, Module } from "@nestjs/common";

import { CONFIG, type Env } from "./config/env";

@Global()
@Module({})
export class ConfigModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: CONFIG, useValue: env }],
      exports: [CONFIG],
    };
  }
}
