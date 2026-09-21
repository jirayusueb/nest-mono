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
  list: (params: { page?: number; limit?: number } = {}) =>
    apiFetch<Page<Post>>(
      `/v1/posts?${new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 100),
      })}`,
    ),

  get: (slug: string) => apiFetch<Post>(`/v1/posts/${slug}`),

  categories: () =>
    apiFetch<{ categories: { name: string; slug: string }[] }>(
      "/v1/posts/categories",
    ),

  create: (draft: PostDraft) =>
    apiFetch<Post>("/v1/posts", {
      method: "POST",
      body: JSON.stringify(draft),
    }),

  update: (id: string, patch: PostPatch) =>
    apiFetch<Post>(`/v1/posts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/v1/posts/${id}`, { method: "DELETE" }),
};
