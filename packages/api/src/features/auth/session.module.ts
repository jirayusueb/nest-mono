import { Global, Module } from "@nestjs/common";

import {
  ADMIN_EMAILS,
  parseAdminEmails,
} from "~/shared/infrastructure/config/admin-emails";
import { CONFIG, type Env } from "~/shared/infrastructure/config/env";
import { CookieService } from "~/shared/presentation/http/cookie-service";

import { AuthModule } from "./auth.module";

@Global()
@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: ADMIN_EMAILS,
      useFactory: (env: Env) => parseAdminEmails(env.ADMIN_EMAILS),
      inject: [CONFIG],
    },
    CookieService,
  ],
  exports: [AuthModule, ADMIN_EMAILS, CookieService],
})
export class SessionModule {}
