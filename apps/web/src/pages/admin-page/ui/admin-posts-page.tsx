"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Result } from "better-result";
import { Page } from "@nest-mono/ui";
import { POST_QUERIES, useRemovePost } from "~/features/manage-posts";

// ponytail: edit/delete stay author-scoped server-side; non-authored posts 404
// here — add authorId to PostResponse when multi-admin bites.
export function AdminPostsPage() {
  const removePost = useRemovePost();
  const [error, setError] = useState<string | null>(null);
  const postsQuery = useQuery(POST_QUERIES.list());
  const posts = postsQuery.data?.items ?? [];
  const loadError = postsQuery.error ? String(postsQuery.error) : null;

  const handleDelete = async (id: string) => {
    const result = await Result.tryPromise({
      try: () => removePost.mutateAsync(id),
      catch: (e) => (e instanceof Error ? e.message : String(e)),
    });

    if (result.isErr()) {
      setError(result.error);
    }
  };

  return (
    <Page>
      <Page.Header>
        <Page.Title>Posts</Page.Title>
        <Button component={Link} to="/admin/blog/new" size="small">
          New post
        </Button>
      </Page.Header>

      {(error ?? loadError) ? (
        <Typography color="error">{error ?? loadError}</Typography>
      ) : null}

      <Stack spacing={2}>
        {posts.length === 0 ? (
          <Typography color="text.secondary">No posts yet.</Typography>
        ) : null}
        {posts.map((post) => (
          <Card key={post.id}>
            {post.thumbnailUrl ? (
              <CardMedia
                component="img"
                height={200}
                image={post.thumbnailUrl}
                alt={post.title}
              />
            ) : null}
            <CardContent>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "baseline" }}
              >
                <Typography variant="h5" component="h2" sx={{ flex: 1 }}>
                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {post.title}
                  </Link>
                </Typography>
                <Link
                  to="/admin/blog/$id/edit"
                  params={{ id: post.id }}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <IconButton size="small" aria-label="Edit">
                    ✎
                  </IconButton>
                </Link>
                <IconButton
                  size="small"
                  aria-label="Delete"
                  onClick={() => void handleDelete(post.id)}
                >
                  ✕
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {post.category ? (
                  <Chip size="small" label={post.category.name} />
                ) : null}
                {post.tags.map((tag) => (
                  <Chip
                    key={tag.slug}
                    size="small"
                    variant="outlined"
                    label={tag.name}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Page>
  );
}
