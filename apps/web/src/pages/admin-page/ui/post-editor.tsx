"use client";

import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Result } from "better-result";
import { Form, MarkdownEditor } from "@nest-mono/ui";
import {
  POST_QUERIES,
  uploadImage,
  type PostDraft,
} from "~/features/manage-posts";

export interface EditorDraft {
  title: string;
  content: string;
  category: string;
  tags: string;
  thumbnailUrl: string | null;
}

export function PostEditor({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial: EditorDraft;
  submitLabel: string;
  onSubmit: (draft: PostDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const categoriesQuery = useQuery(POST_QUERIES.categoryNames());
  const categories = categoriesQuery.data ?? [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const body: PostDraft = {
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
      try: () => onSubmit(body),
      catch: (e) => (e instanceof Error ? e.message : String(e)),
    });

    if (result.isErr()) {
      setError(result.error);
    }
  };

  const handleThumbnail = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    const url = await uploadImage(file);
    setDraft((current) => ({ ...current, thumbnailUrl: url }));
  };

  return (
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
            <img src={draft.thumbnailUrl} alt="Thumbnail preview" height={40} />
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
        value={draft.content}
        onChange={(content) => setDraft((current) => ({ ...current, content }))}
        uploadImage={uploadImage}
      />
      <Form.Submit>{submitLabel}</Form.Submit>
      {error ? <Typography color="error">{error}</Typography> : null}
    </Form>
  );
}
