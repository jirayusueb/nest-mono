import { type DynamicModule, Global, Module } from "@nestjs/common";

import { ConfigService } from "./config/config-service";
import type { Env } from "./config/env";

@Global()
@Module({})
export class ConfigModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: ConfigService, useValue: new ConfigService(env) }],
      exports: [ConfigService],
    };
  }
}
