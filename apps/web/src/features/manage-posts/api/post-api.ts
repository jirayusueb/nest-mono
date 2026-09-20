import { apiFetch, type Page, type Post } from "~/shared/api";

export interface PostDraft {
  title: string;
  content: string;
  category?: string;
  tags: string[];
  thumbnailUrl?: string | null;
}

export interface PostPatch {
  title?: string;
  content?: string;
  category?: string | null;
  tags?: string[];
  thumbnailUrl?: string | null;
}

export const postApi = {
  // ponytail: one big page keeps today's "show every post" UI; add pager
  // controls when a real page size is needed.
  list: (params: { page?: number; limit?: number } = {}) =>
    apiFetch<Page<Post>>(
      `/api/posts?${new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 100),
      })}`,
    ),

  get: (slug: string) => apiFetch<Post>(`/api/posts/${slug}`),

  categories: () =>
    apiFetch<{ categories: { name: string; slug: string }[] }>(
      "/api/posts/categories",
    ),

  create: (draft: PostDraft) =>
    apiFetch<Post>("/api/posts", {
      method: "POST",
      body: JSON.stringify(draft),
    }),

  update: (id: string, patch: PostPatch) =>
    apiFetch<Post>(`/api/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/api/posts/${id}`, { method: "DELETE" }),
};
