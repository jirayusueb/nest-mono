import { Module } from "@nestjs/common";
import { DATE_PROVIDER, type IDateProvider } from "../../shared/application/interfaces/i-date-provider";
import { UNIT_OF_WORK, type IUnitOfWork } from "../../shared/application/interfaces/i-unit-of-work";
import { ID_GENERATOR, type IIdGenerator } from "../../shared/application/interfaces/i-id-generator";
import { SESSION_RESOLVER } from "../../shared/application/interfaces/i-session-resolver";
import { ADMIN_EMAILS } from "../../shared/infrastructure/config/admin-emails";
import { DATABASE, type Database } from "../../shared/infrastructure/database/database";
import { CONFIG, type Env } from "../../shared/infrastructure/config/env";
import { SESSION_COOKIE_SECURE } from "../../shared/presentation/http/cookie";
import { GetSessionUseCase } from "./application/usecases/get-session";
import { SignInUseCase } from "./application/usecases/sign-in";
import { SignOutUseCase } from "./application/usecases/sign-out";
import { SignUpUseCase } from "./application/usecases/sign-up";
import { IDENTITY_REPOSITORY, type IIdentityRepository } from "./application/ports/i-identity-repository";
import { PASSWORD_HASHER, type IPasswordHasher } from "./application/ports/i-password-hasher";
import { SESSION_REPOSITORY, type ISessionRepository } from "./application/ports/i-session-repository";
import { SESSION_TOKEN_SERVICE, type ISessionTokenService } from "./application/ports/i-session-token-service";
import { SessionIssuer } from "./application/services/session-issuer";
import { IdentityRepositoryAdapter } from "./identity-repository.adapter";
import { DrizzleSessionRepository } from "./infrastructure/repositories/drizzle-session-repository";
import { ScryptPasswordHasher } from "./infrastructure/services/scrypt-password-hasher";
import { WebCryptoSessionTokenService } from "./infrastructure/services/webcrypto-session-token-service";
import { AuthController } from "./presentation/http/auth.controller";
import { SessionResolver } from "./application/services/session-resolver";
import { USER_REPOSITORY, type IUserRepository } from "../user/application/ports/i-user-repository";
import { UserModule } from "../user/user.module";

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  exports: [SESSION_RESOLVER],
  providers: [
    {
      provide: IDENTITY_REPOSITORY,
      useFactory: (users: IUserRepository, db: Database) =>
        new IdentityRepositoryAdapter(users, db),
      inject: [USER_REPOSITORY, DATABASE],
    },
    { provide: SESSION_REPOSITORY, useClass: DrizzleSessionRepository },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    { provide: SESSION_TOKEN_SERVICE, useClass: WebCryptoSessionTokenService },
    {
      provide: SessionIssuer,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
        ids: IIdGenerator,
        dates: IDateProvider,
        adminEmails: ReadonlySet<string>,
      ) => new SessionIssuer(sessions, tokens, ids, dates, adminEmails),
      inject: [
        SESSION_REPOSITORY,
        SESSION_TOKEN_SERVICE,
        ID_GENERATOR,
        DATE_PROVIDER,
        ADMIN_EMAILS,
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
        IDENTITY_REPOSITORY,
        PASSWORD_HASHER,
        SessionIssuer,
        ID_GENERATOR,
        DATE_PROVIDER,
        UNIT_OF_WORK,
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
        IDENTITY_REPOSITORY,
        PASSWORD_HASHER,
        SessionIssuer,
        DATE_PROVIDER,
      ],
    },
    {
      provide: SignOutUseCase,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
      ) => new SignOutUseCase(sessions, tokens),
      inject: [SESSION_REPOSITORY, SESSION_TOKEN_SERVICE],
    },
    {
      provide: GetSessionUseCase,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
        identities: IIdentityRepository,
        dates: IDateProvider,
        adminEmails: ReadonlySet<string>,
      ) =>
        new GetSessionUseCase(sessions, tokens, identities, dates, adminEmails),
      inject: [
        SESSION_REPOSITORY,
        SESSION_TOKEN_SERVICE,
        IDENTITY_REPOSITORY,
        DATE_PROVIDER,
        ADMIN_EMAILS,
      ],
    },
    {
      provide: SESSION_RESOLVER,
      useFactory: (getSession: GetSessionUseCase) =>
        new SessionResolver(getSession),
      inject: [GetSessionUseCase],
    },
    {
      provide: SESSION_COOKIE_SECURE,
      useFactory: (env: Env) => env.NODE_ENV === "production",
      inject: [CONFIG],
    },
  ],
})
export class AuthModule {}
