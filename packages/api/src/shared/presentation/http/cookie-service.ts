import type { CookieSerializeOptions } from "@fastify/cookie";
import { Injectable } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

@Injectable()
export class CookieService {
  read(request: FastifyRequest, name: string): string | null {
    return request.cookies[name] ?? null;
  }

  set(
    reply: FastifyReply,
    name: string,
    value: string,
    options: CookieSerializeOptions,
  ): void {
    reply.cookie(name, value, options);
  }

  clear(
    reply: FastifyReply,
    name: string,
    options: CookieSerializeOptions,
  ): void {
    reply.clearCookie(name, options);
  }
}
