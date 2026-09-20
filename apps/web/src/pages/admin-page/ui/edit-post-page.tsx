"use client";

import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import { Page } from "@nest-mono/ui";
import { POST_QUERIES, useUpdatePost } from "~/features/manage-posts";
import { PostEditor, type EditorDraft } from "./post-editor";

export function EditPostPage() {
  const { id } = useParams({ from: "/admin/blog/$id/edit" });
  const updatePost = useUpdatePost();
  const { navigate } = useRouter();
  const postsQuery = useQuery(POST_QUERIES.list());

  if (postsQuery.isPending) {
    return (
      <Page>
        <p>Loading…</p>
      </Page>
    );
  }

  const post = postsQuery.data?.items.find((candidate) => candidate.id === id);

  if (!post) {
    return (
      <Page>
        <Page.Header>
          <Page.Title>Post not found</Page.Title>
        </Page.Header>
        <Link to="/admin">← Back to posts</Link>
      </Page>
    );
  }

  const initial: EditorDraft = {
    title: post.title,
    content: post.content,
    category: post.category?.name ?? "",
    tags: post.tags.map((tag) => tag.name).join(", "),
    thumbnailUrl: post.thumbnailUrl,
  };

  return (
    <Page>
      <Page.Header>
        <Page.Title>Edit: {post.title}</Page.Title>
      </Page.Header>
      <PostEditor
        initial={initial}
        submitLabel="Save"
        onSubmit={async (draft) => {
          await updatePost.mutateAsync({ id: post.id, patch: draft });
          await navigate({ to: "/admin" });
        }}
      />
    </Page>
  );
}
