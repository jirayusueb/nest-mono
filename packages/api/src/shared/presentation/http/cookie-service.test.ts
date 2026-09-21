import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it } from "vitest";

import { CookieService } from "./cookie-service";

/** Recording reply capturing cookie/clearCookie calls. */
function recordingReply() {
  const set: Array<[string, string, CookieSerializeOptions]> = [];
  const cleared: Array<[string, CookieSerializeOptions]> = [];

  // SAFETY: the recording object implements exactly the cookie/clearCookie
  // surface CookieService touches.
  const reply = {
    clearCookie: (name: string, options: CookieSerializeOptions) => {
      cleared.push([name, options]);

      return reply;
    },
    cookie: (
      name: string,
      value: string,
      options: CookieSerializeOptions,
    ) => {
      set.push([name, value, options]);

      return reply;
    },
  } as FastifyReply;

  return { reply, set, cleared };
}

function reqWithCookies(cookies: Record<string, string | undefined>) {
  // SAFETY: the fake carries only the cookies map CookieService reads.
  return { cookies } as FastifyRequest;
}

describe("CookieService", () => {
  const service = new CookieService();

  it("read returns the parsed cookie value", () => {
    expect(service.read(reqWithCookies({ token: "a+b=c" }), "token")).toBe(
      "a+b=c",
    );
  });

  it("read returns null when the cookie is absent", () => {
    expect(service.read(reqWithCookies({ token: "a+b=c" }), "other")).toBe(
      null,
    );
  });

  it("set forwards name, value, and options to reply.cookie", () => {
    const { reply, set } = recordingReply();

    const options: CookieSerializeOptions = {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: true,
    };

    service.set(reply, "token", "a+b=c", options);

    expect(set).toEqual([["token", "a+b=c", options]]);
  });

  it("clear forwards name and options to reply.clearCookie", () => {
    const { reply, cleared } = recordingReply();

    const options: CookieSerializeOptions = { path: "/" };

    service.clear(reply, "token", options);

    expect(cleared).toEqual([["token", options]]);
  });
});
