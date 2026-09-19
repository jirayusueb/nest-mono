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
  SESSION_COOKIE,
  clearSessionCookieOptions,
  readSessionToken,
  sessionCookieOptions,
} from "../../../../shared/presentation/http/cookie";
import { GetSession } from "../../application/usecases/get-session";
import { SignIn } from "../../application/usecases/sign-in";
import { SignOut } from "../../application/usecases/sign-out";
import { SignUp } from "../../application/usecases/sign-up";
import {
  toGetSessionResponse,
  toUserResponse,
  type GetSessionResponse,
  type UserResponse,
} from "./dtos/auth-response";
import { signInSchema, signUpSchema } from "./dtos/auth-schemas";
import type { SignInBody, SignUpBody } from "./dtos/auth-schemas";

function clientMeta(req: FastifyRequest) {
  // SAFETY: user-agent is string|string[]|undefined; single string per HTTP/1.1
  // spec here.
  return {
    ipAddress: req.ip ?? null,
    userAgent: (req.headers["user-agent"] as string | undefined) ?? null,
  };
}

@Controller("api/auth")
export class AuthController {
  constructor(
    @Inject(SignUp) private readonly signUp: SignUp,
    @Inject(SignIn) private readonly signIn: SignIn,
    @Inject(SignOut) private readonly signOut: SignOut,
    @Inject(GetSession) private readonly getSession: GetSession,
  ) {}

  @Post("sign-up/email")
  @HttpCode(201)
  async signUpEmail(
    @Body({ schema: signUpSchema }) input: SignUpBody,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ user: UserResponse; token: string }> {
    const result = await this.signUp.execute({ ...input, ...clientMeta(req) });

    if (result.isErr()) {
      throw result.error;
    }

    const { user, token, expiresAt } = result.value;
    reply.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

    return { user: toUserResponse(user), token };
  }

  @Post("sign-in/email")
  @HttpCode(200)
  async signInEmail(
    @Body({ schema: signInSchema }) input: SignInBody,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ user: UserResponse; token: string }> {
    const result = await this.signIn.execute({ ...input, ...clientMeta(req) });

    if (result.isErr()) {
      throw result.error;
    }

    const { user, token, expiresAt } = result.value;
    reply.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

    return { user: toUserResponse(user), token };
  }

  @Post("sign-out")
  async signOutRoute(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<{ success: boolean }> {
    const token = req.cookies[SESSION_COOKIE] ?? null;

    if (token) {
      const result = await this.signOut.execute({ token });

      if (result.isErr()) {
        throw result.error;
      }
    }

    reply.cookie(SESSION_COOKIE, "", clearSessionCookieOptions());

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

    const result = await this.getSession.execute({ token });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value ? toGetSessionResponse(result.value) : null;
  }
}
