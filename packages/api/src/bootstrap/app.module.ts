import { type DynamicModule, Module } from "@nestjs/common";

import { AuthModule } from "~/features/auth/auth.module";
import { BlogModule } from "~/features/blog/blog.module";
import { MediaModule } from "~/features/media/media.module";
import { UserModule } from "~/features/user/user.module";
import { ConfigModule } from "~/shared/infrastructure/config.module";
import type { Env } from "~/shared/infrastructure/config/env";
import { DatabaseModule } from "~/shared/infrastructure/database.module";
import { AppErrorFilter } from "~/shared/presentation/http/filters/app-error.filter";
import { HealthController } from "~/shared/presentation/http/health.controller";

@Module({})
export class AppModule {
  static forRoot(env: Env): DynamicModule {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot(env),
        DatabaseModule,
        AuthModule,
        UserModule,
        BlogModule,
        MediaModule,
      ],
      controllers: [HealthController],
      providers: [AppErrorFilter],
    };
  }
}
