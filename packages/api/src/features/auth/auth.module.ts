import { Global, Module } from "@nestjs/common";

import { IUserRepository } from "~/features/user/application/ports/i-user-repository";
import { UserModule } from "~/features/user/user.module";
import { IDateProvider } from "~/shared/application/interfaces/i-date-provider";
import { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";
import { ISessionResolver } from "~/shared/application/interfaces/i-session-resolver";
import { IUnitOfWork } from "~/shared/application/interfaces/i-unit-of-work";
import { ConfigService } from "~/shared/infrastructure/config/config-service";
import { DATABASE, type Database } from "~/shared/infrastructure/db/database";
import { SESSION_COOKIE_SECURE } from "~/shared/presentation/http/cookie";

import { IIdentityRepository } from "./application/ports/i-identity-repository";
import { IPasswordHasher } from "./application/ports/i-password-hasher";
import { ISessionRepository } from "./application/ports/i-session-repository";
import { ISessionTokenService } from "./application/ports/i-session-token-service";
import { SessionIssuer } from "./application/services/session-issuer";
import { SessionResolver } from "./application/services/session-resolver";
import { GetSessionUseCase } from "./application/usecases/get-session";
import { SignInUseCase } from "./application/usecases/sign-in";
import { SignOutUseCase } from "./application/usecases/sign-out";
import { SignUpUseCase } from "./application/usecases/sign-up";
import { IdentityRepositoryAdapter } from "./infrastructure/adapters/identity-repository.adapter";
import { DrizzleSessionRepository } from "./infrastructure/repositories/drizzle-session-repository";
import { ScryptPasswordHasher } from "./infrastructure/services/scrypt-password-hasher";
import { WebCryptoSessionTokenService } from "./infrastructure/services/webcrypto-session-token-service";
import { AuthController } from "./presentation/http/auth.controller";

@Global()
@Module({
  imports: [UserModule],
  controllers: [AuthController],
  exports: [ISessionResolver],
  providers: [
    {
      provide: IIdentityRepository,
      useFactory: (users: IUserRepository, db: Database) =>
        new IdentityRepositoryAdapter(users, db),
      inject: [IUserRepository, DATABASE],
    },
    { provide: ISessionRepository, useClass: DrizzleSessionRepository },
    { provide: IPasswordHasher, useClass: ScryptPasswordHasher },
    { provide: ISessionTokenService, useClass: WebCryptoSessionTokenService },
    {
      provide: SessionIssuer,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
        ids: IIdGenerator,
        dates: IDateProvider,
        config: ConfigService,
      ) => new SessionIssuer(sessions, tokens, ids, dates, config.adminEmails),
      inject: [
        ISessionRepository,
        ISessionTokenService,
        IIdGenerator,
        IDateProvider,
        ConfigService,
      ],
    },
    {
      provide: SignUpUseCase,
      useFactory: (
        identities: IIdentityRepository,
        hasher: IPasswordHasher,
        issuer: SessionIssuer,
        ids: IIdGenerator,
        dates: IDateProvider,
        uow: IUnitOfWork,
      ) => new SignUpUseCase(identities, hasher, issuer, ids, dates, uow),
      inject: [
        IIdentityRepository,
        IPasswordHasher,
        SessionIssuer,
        IIdGenerator,
        IDateProvider,
        IUnitOfWork,
      ],
    },
    {
      provide: SignInUseCase,
      useFactory: (
        identities: IIdentityRepository,
        hasher: IPasswordHasher,
        issuer: SessionIssuer,
        dates: IDateProvider,
      ) => new SignInUseCase(identities, hasher, issuer, dates),
      inject: [
        IIdentityRepository,
        IPasswordHasher,
        SessionIssuer,
        IDateProvider,
      ],
    },
    {
      provide: SignOutUseCase,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
      ) => new SignOutUseCase(sessions, tokens),
      inject: [ISessionRepository, ISessionTokenService],
    },
    {
      provide: GetSessionUseCase,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
        identities: IIdentityRepository,
        dates: IDateProvider,
        config: ConfigService,
      ) =>
        new GetSessionUseCase(sessions, tokens, identities, dates, config.adminEmails),
      inject: [
        ISessionRepository,
        ISessionTokenService,
        IIdentityRepository,
        IDateProvider,
        ConfigService,
      ],
    },
    {
      provide: ISessionResolver,
      useFactory: (getSession: GetSessionUseCase) =>
        new SessionResolver(getSession),
      inject: [GetSessionUseCase],
    },
    {
      provide: SESSION_COOKIE_SECURE,
      useFactory: (config: ConfigService) => config.isProduction,
      inject: [ConfigService],
    },
  ],
})
export class AuthModule {}
