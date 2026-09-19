import { Global, Module } from "@nestjs/common";
import { SESSION_RESOLVER } from "../shared/tokens";
import { AuthModule } from "../features/auth/auth.module";
import { SessionResolver } from "../features/auth/presentation/session-resolver";

@Global()
@Module({
  imports: [AuthModule],
  providers: [{ provide: SESSION_RESOLVER, useExisting: SessionResolver }],
  exports: [SESSION_RESOLVER],
})
export class SessionModule {}
