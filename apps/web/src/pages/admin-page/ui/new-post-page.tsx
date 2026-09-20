"use client";

import { useRouter } from "@tanstack/react-router";
import { Page } from "@nest-mono/ui";
import { useCreatePost } from "~/features/manage-posts";
import { PostEditor, type EditorDraft } from "./post-editor";

const EMPTY_DRAFT: EditorDraft = {
  title: "",
  content: "",
  category: "",
  tags: "",
  thumbnailUrl: null,
};

export function NewPostPage() {
  const createPost = useCreatePost();
  const { navigate } = useRouter();

  return (
    <Page>
      <Page.Header>
        <Page.Title>New post</Page.Title>
      </Page.Header>
      <PostEditor
        initial={EMPTY_DRAFT}
        submitLabel="Publish"
        onSubmit={async (draft) => {
          await createPost.mutateAsync(draft);
          await navigate({ to: "/admin" });
        }}
      />
    </Page>
  );
}
