import type { ArgumentsHost } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { describe, expect, it } from "vitest";

import type { ILogger } from "~/shared/application/interfaces/i-logger";
import { AppError } from "~/shared/kernel/errors/app-error";

import { AppErrorFilter } from "./app-error.filter";

/** Drive the filter with a recording FastifyReply; returns what was sent. */
function runFilter(error: unknown, logger?: Partial<ILogger>) {
  const sent = { status: -1, body: undefined as unknown, contentType: "" };

  const reply = {
    header: (key: string, value: string) => {
      if (key === "content-type") sent.contentType = value;

      return reply;
    },
    send: (body: unknown) => {
      sent.body = body;

      return reply;
    },
    status: (status: number) => {
      sent.status = status;

      return reply;
    },
  } as FastifyReply;

  const host = {
    switchToHttp: () => ({ getResponse: () => reply }),
  } as ArgumentsHost;

  const logged: Array<{ message: string; error?: Error }> = [];

  const filter = new AppErrorFilter({
    error: (message, err) => logged.push({ message, error: err }),
    ...logger,
  } as ILogger);

  return { sent, logged, run: () => filter.catch(error, host) };
}

describe("app error filter", () => {
  it("maps AppError.notFound to a 404 problem+json body", async () => {
    const { sent, run } = runFilter(AppError.notFound("Post"));

    await run();

    expect(sent.status).toBe(404);
    expect(sent.contentType).toBe("application/problem+json");
    expect(sent.body).toEqual({
      type: "about:blank",
      code: "NotFound",
      detail: "Post not found",
      status: 404,
      title: "Not Found",
    });
  });

  it("falls back to 500 for codes missing from the map", async () => {
    const { sent, run } = runFilter(new AppError("Weird", "boom"));

    await run();

    expect(sent.status).toBe(500);
    expect(sent.body).toEqual({
      type: "about:blank",
      code: "Weird",
      detail: "boom",
      status: 500,
      title: "Internal Server Error",
    });
  });

  it("wraps non-AppError throws as Internal and logs them", async () => {
    const { sent, logged, run } = runFilter(new Error("explode"));

    await run();

    expect(sent.status).toBe(500);
    expect(sent.body).toEqual({
      type: "about:blank",
      code: "Internal",
      detail: "Internal server error",
      status: 500,
      title: "Internal Server Error",
    });
    expect(logged).toEqual([
      { message: "Unhandled error", error: new Error("explode") },
    ]);
  });
});
