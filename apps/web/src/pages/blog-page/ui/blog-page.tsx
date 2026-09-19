"use client";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import { useState, type FormEvent } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Result } from "better-result";
import { Form, MarkdownEditor, Page } from "@nest-mono/ui";
import { useSession } from "~/entities/user";
import type { Post } from "~/shared/api";
import { POST_QUERIES } from "../api/post-queries";
import {
  useCreatePost,
  useRemovePost,
  useUpdatePost,
} from "../api/post-mutations";
import { uploadImage } from "../api/upload-image";

type PostDraft = {
  title: string;
  content: string;
  category: string;
  tags: string;
  thumbnailUrl: string | null;
};

const EMPTY_DRAFT: PostDraft = {
  title: "",
  content: "",
  category: "",
  tags: "",
  thumbnailUrl: null,
};

export function BlogPage() {
  const { user } = useSession();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const removePost = useRemovePost();
  const postsQuery = useQuery(POST_QUERIES.list());
  const categoriesQuery = useQuery(POST_QUERIES.categoryNames());
  const posts = postsQuery.data?.posts ?? [];
  const categories = categoriesQuery.data ?? [];
  const loadError = postsQuery.error ? String(postsQuery.error) : null;
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editing, setEditing] = useState<Post | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startEdit = (post: Post) => {
    setEditing(post);
    setDraft({
      title: post.title,
      content: post.content,
      category: post.category?.name ?? "",
      tags: post.tags.map((tag) => tag.name).join(", "),
      thumbnailUrl: post.thumbnailUrl,
    });
    setEditorKey((key) => key + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setEditorKey((key) => key + 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const body = {
      title: draft.title,
      content: draft.content,
      category: draft.category === "" ? undefined : draft.category,
      tags: draft.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== ""),
      thumbnailUrl: draft.thumbnailUrl,
    };

    const result = await Result.tryPromise({
      try: () =>
        editing
          ? updatePost.mutateAsync({ id: editing.id, patch: body })
          : createPost.mutateAsync(body),
      catch: (e) => (e instanceof Error ? e.message : String(e)),
    });

    if (result.isErr()) {
      setError(result.error);

      return;
    }

    cancelEdit();
  };

  const handleDelete = async (post: Post) => {
    await removePost.mutateAsync(post.id);
  };

  const handleThumbnail = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const url = await uploadImage(file);
    setDraft((current) => ({ ...current, thumbnailUrl: url }));
  };

  return (
    <Page>
      <Page.Header>
        <Page.Title>Blog</Page.Title>
      </Page.Header>

      {user ? (
        <Stack sx={{ mb: 6, gap: 2 }}>
          <Typography variant="h6" component="h2">
            {editing ? `Editing: ${editing.title}` : "New post"}
          </Typography>
          <Form onSubmit={(event) => void handleSubmit(event)}>
            <Form.Field
              label="Title"
              value={draft.title}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              required
            />
            <Form.Field
              select
              label="Category"
              value={draft.category}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {categories.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Form.Field>
            <Form.Field
              label="Tags (comma separated)"
              value={draft.tags}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  tags: event.target.value,
                }))
              }
            />
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Button component="label" size="small">
                Thumbnail
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  onChange={(event) => {
                    void handleThumbnail(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </Button>
              {draft.thumbnailUrl ? (
                <>
                  {/* biome-ignore lint/performance/noImgElement: fixed-size local preview */}
                  <img
                    src={draft.thumbnailUrl}
                    alt="Thumbnail preview"
                    height={40}
                  />
                  <Button
                    size="small"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        thumbnailUrl: null,
                      }))
                    }
                  >
                    Remove
                  </Button>
                </>
              ) : null}
            </Stack>
            <MarkdownEditor
              key={editorKey}
              value={draft.content}
              onChange={(content) =>
                setDraft((current) => ({ ...current, content }))
              }
              uploadImage={uploadImage}
            />
            <Stack direction="row" spacing={1}>
              <Form.Submit>{editing ? "Save" : "Publish"}</Form.Submit>
              {editing ? <Button onClick={cancelEdit}>Cancel</Button> : null}
            </Stack>
            {(error ?? loadError) ? (
              <Typography color="error">{error ?? loadError}</Typography>
            ) : null}
          </Form>
        </Stack>
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
                {user ? (
                  <>
                    <IconButton
                      size="small"
                      aria-label="Edit"
                      onClick={() => startEdit(post)}
                    >
                      ✎
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Delete"
                      onClick={() => void handleDelete(post)}
                    >
                      ✕
                    </IconButton>
                  </>
                ) : null}
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
