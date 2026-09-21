import { act, render, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { User } from "~/shared/api";

import { SessionProvider, useSession } from "./session";

const USER: User = {
  id: "u1",
  name: "A",
  email: "a@b.c",
  emailVerified: true,
  image: null,
  role: "admin",
};

function stubSession(body: { user: User } | null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
  );
}

function withProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SessionProvider", () => {
  it("renders children", () => {
    stubSession(null);

    const { getByText } = render(
      <SessionProvider>
        <span>hi</span>
      </SessionProvider>,
    );

    expect(getByText("hi")).toBeInTheDocument();
  });

  it("loads the user on mount and exposes it through useSession", async () => {
    stubSession({ user: USER });

    const { result } = renderHook(() => useSession(), {
      wrapper: withProvider,
    });

    await waitFor(() => expect(result.current.user).toEqual(USER));
    expect(result.current.loading).toBe(false);
  });

  it("keeps the user null when unauthenticated", async () => {
    stubSession(null);

    const { result } = renderHook(() => useSession(), {
      wrapper: withProvider,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("refresh re-fetches and updates the user", async () => {
    stubSession({ user: USER });

    const { result } = renderHook(() => useSession(), {
      wrapper: withProvider,
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    stubSession({ user: { ...USER, name: "B" } });

    await act(() => result.current.refresh());
    expect(result.current.user?.name).toBe("B");
  });

  it("throws when useSession is used outside a provider", () => {
    expect(() => renderHook(() => useSession())).toThrow(
      "useSession must be used within SessionProvider",
    );
  });
});