import { afterEach, describe, expect, it, vi } from "vitest";

import { authClient } from "./auth-client";

function stubFetch(body: string, status = 200) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
}

const USER = { id: "u1", name: "A", email: "a@b.c", emailVerified: true, image: null, role: "admin" as const };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("authClient", () => {
  it("signs up and returns the user", async () => {
    stubFetch(JSON.stringify({ user: USER }));
    const user = await authClient.signUpEmail({ email: "a@b.c", password: "p" });
    expect(user).toEqual(USER);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/auth/sign-up/email"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("signs in and returns the user", async () => {
    stubFetch(JSON.stringify({ user: USER }));
    const user = await authClient.signInEmail({ email: "a@b.c", password: "p" });
    expect(user).toEqual(USER);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/auth/sign-in/email"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("signs out via POST", async () => {
    stubFetch("null", 204);
    await authClient.signOut();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/auth/sign-out"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns the user from getSession", async () => {
    stubFetch(JSON.stringify({ user: USER }));
    await expect(authClient.getSession()).resolves.toEqual(USER);
  });

  it("returns null when getSession has no user", async () => {
    stubFetch("null");
    await expect(authClient.getSession()).resolves.toBeNull();
  });
});