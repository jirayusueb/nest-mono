"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Page } from "@nest-mono/ui";
import { POST_QUERIES } from "~/features/manage-posts";

export function BlogPage() {
  const postsQuery = useQuery(POST_QUERIES.list());
  const posts = postsQuery.data?.items ?? [];
  const loadError = postsQuery.error ? String(postsQuery.error) : null;

  return (
    <Page>
      <Page.Header>
        <Page.Title>Blog</Page.Title>
      </Page.Header>

      {loadError ? <Typography color="error">{loadError}</Typography> : null}

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
