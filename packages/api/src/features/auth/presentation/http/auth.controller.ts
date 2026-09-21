import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

import { GetSessionUseCase } from "~/features/auth/application/usecases/get-session";
import { SignInUseCase } from "~/features/auth/application/usecases/sign-in";
import { SignOutUseCase } from "~/features/auth/application/usecases/sign-out";
import { SignUpUseCase } from "~/features/auth/application/usecases/sign-up";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_SECURE,
  sessionCookieOptions,
} from "~/shared/presentation/http/cookie";
import { CookieService } from "~/shared/presentation/http/cookie-service";

import type {
  AuthSessionResponse,
  GetSessionResponse,
  SignOutResponse,
} from "./dtos/auth-response";
import { signInSchema, signUpSchema } from "./dtos/auth-schemas";
import type { SignInRequest, SignUpRequest } from "./dtos/auth-schemas";
import { AuthMappers } from "./mappers/auth-mappers";

function clientMeta(req: FastifyRequest) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
  };
}

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(SignUpUseCase) private readonly signUp: SignUpUseCase,
    @Inject(SignInUseCase) private readonly signIn: SignInUseCase,
    @Inject(SignOutUseCase) private readonly signOut: SignOutUseCase,
    @Inject(GetSessionUseCase) private readonly getSession: GetSessionUseCase,
    @Inject(SESSION_COOKIE_SECURE) private readonly cookieSecure: boolean,
    @Inject(CookieService) private readonly cookies: CookieService,
  ) {}

  @Post("sign-up/email")
  @HttpCode(201)
  async signUpEmail(
    @Body({ schema: signUpSchema }) input: SignUpRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthSessionResponse> {
    const result = await this.signUp.execute(
      AuthMappers.toSignUpInput(input, clientMeta(req)),
    )

    if (result.isErr()) {
      throw result.error;
    }

    const { user, token, expiresAt } = result.value;
    this.cookies.set(
      reply,
      SESSION_COOKIE,
      token,
      sessionCookieOptions(expiresAt, this.cookieSecure),
    );

    return { user: AuthMappers.toSessionUserResponse(user), token };
  }

  @Post("sign-in/email")
  @HttpCode(200)
  async signInEmail(
    @Body({ schema: signInSchema }) input: SignInRequest,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthSessionResponse> {
    const result = await this.signIn.execute(
      AuthMappers.toSignInInput(input, clientMeta(req)),
    );

    if (result.isErr()) {
      throw result.error;
    }

    const { user, token, expiresAt } = result.value;

    this.cookies.set(
      reply,
      SESSION_COOKIE,
      token,
      sessionCookieOptions(expiresAt, this.cookieSecure),
    );

    return { user: AuthMappers.toSessionUserResponse(user), token };
  }

  @Post("sign-out")
  async signOutRoute(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<SignOutResponse> {
    const token = this.cookies.read(req, SESSION_COOKIE);

    if (token) {
      await this.signOut.execute({ token });
    }

    this.cookies.clear(
      reply,
      SESSION_COOKIE,
      sessionCookieOptions(new Date(0), this.cookieSecure),
    );

    return { success: true };
  }

  @Get("get-session")
  async getSessionRoute(
    @Req() req: FastifyRequest,
  ): Promise<GetSessionResponse | null> {
    const token = this.cookies.read(req, SESSION_COOKIE);

    if (!token) {
      return null;
    }

    const resolved = await this.getSession.execute({ token });

    return resolved ? AuthMappers.toGetSessionResponse(resolved) : null;
  }
}
