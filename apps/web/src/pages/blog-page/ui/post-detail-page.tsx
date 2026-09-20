"use client";

import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { MarkdownView, Page } from "@nest-mono/ui";
import { useSession } from "~/entities/user";
import { POST_QUERIES } from "~/features/manage-posts";

export function PostDetailPage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const { user } = useSession();

  const {
    data: post,
    isPending,
    isError,
  } = useQuery(POST_QUERIES.detail(slug));

  if (isPending) {
    return (
      <Page>
        <p>Loading…</p>
      </Page>
    );
  }

  if (isError || !post) {
    return (
      <Page>
        <Page.Header>
          <Page.Title>Post not found</Page.Title>
        </Page.Header>
        <Link to="/">← Back to the blog</Link>
      </Page>
    );
  }

  return (
    <Page>
      {post.thumbnailUrl ? (
        // biome-ignore lint/performance/noImgElement: hero image at natural size
        <img
          src={post.thumbnailUrl}
          alt={post.title}
          style={{ width: "100%", maxHeight: 320, objectFit: "cover" }}
        />
      ) : null}
      <Page.Header>
        <Page.Title>{post.title}</Page.Title>
        {post.category || post.tags.length > 0 ? (
          <div style={{ display: "flex", gap: 8 }}>
            {post.category ? <span>Category: {post.category.name}</span> : null}
            {post.tags.length > 0 ? (
              <span>Tags: {post.tags.map((tag) => tag.name).join(", ")}</span>
            ) : null}
          </div>
        ) : null}
      </Page.Header>
      <MarkdownView value={post.content} />
      {user?.role === "admin" ? (
        <p>
          <Link to="/admin">← Manage posts</Link>
        </p>
      ) : null}
    </Page>
  );
}
