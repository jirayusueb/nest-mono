import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Post } from "~/shared/api";

import { postApi } from "./post-api";
import { useCreatePost, useRemovePost, useUpdatePost } from "./post-mutations";

const POST: Post = {
  id: "p1",
  slug: "s",
  title: "T",
  content: "C",
  category: null,
  tags: [],
  thumbnailUrl: null,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const invalidate = vi.spyOn(queryClient, "invalidateQueries");

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, invalidate };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("post mutations", () => {
  it("useCreatePost creates and invalidates post + category queries", async () => {
    const create = vi.spyOn(postApi, "create").mockResolvedValue(POST);
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useCreatePost(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ title: "t", content: "c", tags: [] }),
    );

    expect(create).toHaveBeenCalledWith({ title: "t", content: "c", tags: [] });
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
  });

  it("useUpdatePost patches and invalidates", async () => {
    const update = vi.spyOn(postApi, "update").mockResolvedValue(POST);
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useUpdatePost(), { wrapper });

    await act(() =>
      result.current.mutateAsync({ id: "p1", patch: { title: "x" } }),
    );

    expect(update).toHaveBeenCalledWith("p1", { title: "x" });
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
  });

  it("useRemovePost removes and invalidates", async () => {
    const remove = vi.spyOn(postApi, "remove").mockResolvedValue(undefined);
    const { wrapper, invalidate } = makeWrapper();
    const { result } = renderHook(() => useRemovePost(), { wrapper });

    await act(() => result.current.mutateAsync("p1"));

    expect(remove).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));
  });
});