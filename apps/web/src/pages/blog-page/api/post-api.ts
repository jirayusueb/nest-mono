import { apiFetch, type Post } from "~/shared/api";

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
  list: () => apiFetch<{ posts: Post[] }>("/api/posts"),

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
