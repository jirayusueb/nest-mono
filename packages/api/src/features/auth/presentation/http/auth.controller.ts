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
import {
  SESSION_COOKIE_SECURE,
  SESSION_COOKIE,
  clearSessionCookieOptions,
  readSessionToken,
  sessionCookieOptions,
} from "../../../../shared/presentation/http/cookie";
import type {
  AuthSessionResponse,
  GetSessionResponse,
  SignOutResponse,
} from "./dtos/auth-response";
import { GetSessionUseCase } from "../../application/usecases/get-session";
import { SignInUseCase } from "../../application/usecases/sign-in";
import { SignOutUseCase } from "../../application/usecases/sign-out";
import { SignUpUseCase } from "../../application/usecases/sign-up";
import { AuthMappers } from "./mappers/auth-mappers";
import { signInSchema, signUpSchema } from "./dtos/auth-schemas";
import type { SignInRequest, SignUpRequest } from "./dtos/auth-schemas";

function clientMeta(req: FastifyRequest) {
  return {
    ipAddress: req.ip ?? null,
    // SAFETY: fastify types header values as string|string[]|undefined, but
    // user-agent is set by clients as a single scalar.
    userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
  };
}

@Controller("api/auth")
export class AuthController {
  constructor(
    @Inject(SignUpUseCase) private readonly signUp: SignUpUseCase,
    @Inject(SignInUseCase) private readonly signIn: SignInUseCase,
    @Inject(SignOutUseCase) private readonly signOut: SignOutUseCase,
    @Inject(GetSessionUseCase) private readonly getSession: GetSessionUseCase,
    @Inject(SESSION_COOKIE_SECURE) private readonly cookieSecure: boolean,
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
    );

    if (result.isErr()) {
      throw result.error;
    }

    const { user, token, expiresAt } = result.value;
    reply.cookie(
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
    reply.cookie(
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
    const token = req.cookies[SESSION_COOKIE] ?? null;

    if (token) {
      await this.signOut.execute({ token });
    }

    reply.cookie(
      SESSION_COOKIE,
      "",
      clearSessionCookieOptions(this.cookieSecure),
    );

    return { success: true };
  }

  @Get("get-session")
  async getSessionRoute(
    @Req() req: FastifyRequest,
  ): Promise<GetSessionResponse | null> {
    // SAFETY: header values are string|string[]|undefined, but only the scalar
    // cookie header is read.
    const token = readSessionToken(
      new Headers(req.headers as Record<string, string>),
    );

    if (!token) {
      return null;
    }

    const resolved = await this.getSession.execute({ token });

    return resolved ? AuthMappers.toGetSessionResponse(resolved) : null;
  }
}
