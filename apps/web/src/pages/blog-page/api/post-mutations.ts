import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { POST_QUERIES } from "./post-queries";
import { postApi, type PostDraft, type PostPatch } from "./post-api";

/** Any write can change the list, a post's slug, or the category set. */
function invalidatePostQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: POST_QUERIES.all() });
  void queryClient.invalidateQueries({ queryKey: POST_QUERIES.categories() });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: PostDraft) => postApi.create(draft),
    onSuccess: () => invalidatePostQueries(queryClient),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: PostPatch }) =>
      postApi.update(id, patch),
    onSuccess: () => invalidatePostQueries(queryClient),
  });
}

export function useRemovePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => postApi.remove(id),
    onSuccess: () => invalidatePostQueries(queryClient),
  });
}
