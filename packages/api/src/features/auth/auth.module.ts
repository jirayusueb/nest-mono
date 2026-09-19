import { Module } from "@nestjs/common";
import type { IDateProvider } from "../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../shared/application/interfaces/i-id-generator";
import {
  DATE_PROVIDER,
  ID_GENERATOR,
  IDENTITY_REPOSITORY,
  PASSWORD_HASHER,
  SESSION_REPOSITORY,
  SESSION_TOKEN_SERVICE,
} from "../../shared/tokens";
import { GetSession } from "./application/usecases/get-session";
import { SignIn } from "./application/usecases/sign-in";
import { SignOut } from "./application/usecases/sign-out";
import { SignUp } from "./application/usecases/sign-up";
import type { IIdentityRepository } from "./application/ports/i-identity-repository";
import type { IPasswordHasher } from "./application/ports/i-password-hasher";
import type { ISessionRepository } from "./application/ports/i-session-repository";
import type { ISessionTokenService } from "./application/ports/i-session-token-service";
import { SessionIssuer } from "./application/services/session-issuer";
import { DrizzleIdentityRepository } from "./infrastructure/repositories/drizzle-identity-repository";
import { DrizzleSessionRepository } from "./infrastructure/repositories/drizzle-session-repository";
import { ScryptPasswordHasher } from "./infrastructure/services/scrypt-password-hasher";
import { WebCryptoSessionTokenService } from "./infrastructure/services/webcrypto-session-token-service";
import { AuthController } from "./presentation/http/auth.controller";
import { SessionResolver } from "./presentation/session-resolver";

@Module({
  controllers: [AuthController],
  exports: [SessionResolver],
  providers: [
    { provide: IDENTITY_REPOSITORY, useClass: DrizzleIdentityRepository },
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
      ) => new SessionIssuer(sessions, tokens, ids, dates),
      inject: [
        SESSION_REPOSITORY,
        SESSION_TOKEN_SERVICE,
        ID_GENERATOR,
        DATE_PROVIDER,
      ],
    },
    {
      provide: SignUp,
      useFactory: (
        identities: IIdentityRepository,
        hasher: IPasswordHasher,
        issuer: SessionIssuer,
        ids: IIdGenerator,
        dates: IDateProvider,
      ) => new SignUp(identities, hasher, issuer, ids, dates),
      inject: [
        IDENTITY_REPOSITORY,
        PASSWORD_HASHER,
        SessionIssuer,
        ID_GENERATOR,
        DATE_PROVIDER,
      ],
    },
    {
      provide: SignIn,
      useFactory: (
        identities: IIdentityRepository,
        hasher: IPasswordHasher,
        issuer: SessionIssuer,
        dates: IDateProvider,
      ) => new SignIn(identities, hasher, issuer, dates),
      inject: [
        IDENTITY_REPOSITORY,
        PASSWORD_HASHER,
        SessionIssuer,
        DATE_PROVIDER,
      ],
    },
    {
      provide: SignOut,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
      ) => new SignOut(sessions, tokens),
      inject: [SESSION_REPOSITORY, SESSION_TOKEN_SERVICE],
    },
    {
      provide: GetSession,
      useFactory: (
        sessions: ISessionRepository,
        tokens: ISessionTokenService,
        identities: IIdentityRepository,
        dates: IDateProvider,
      ) => new GetSession(sessions, tokens, identities, dates),
      inject: [
        SESSION_REPOSITORY,
        SESSION_TOKEN_SERVICE,
        IDENTITY_REPOSITORY,
        DATE_PROVIDER,
      ],
    },
    SessionResolver,
  ],
})
export class AuthModule {}
