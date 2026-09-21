import { queryOptions } from "@tanstack/react-query";

import type { Page, Post } from "~/shared/api";

import { postApi } from "./post-api";

export const POST_QUERIES = {
  all: () => ["posts"] as const,
  categories: () => ["post-categories"] as const,
  list: () =>
    queryOptions({
      queryKey: POST_QUERIES.all(),
      queryFn: (): Promise<Page<Post>> => postApi.list(),
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: ["posts", "detail", slug] as const,
      queryFn: () => postApi.get(slug),
    }),
  categoryNames: () =>
    queryOptions({
      queryKey: POST_QUERIES.categories(),
      queryFn: async (): Promise<string[]> =>
        (await postApi.categories()).categories.map(
          (category) => category.name,
        ),
    }),
};
