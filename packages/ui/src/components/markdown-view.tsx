"use client";

import Box from "@mui/material/Box";
import ImageExt from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";

export interface MarkdownViewProps {
  /** Markdown to render read-only. */
  value: string;
}

export function MarkdownView({ value }: MarkdownViewProps) {
  const editor = useEditor({
    extensions: [StarterKit, ImageExt, Markdown],
    content: value,
    contentType: "markdown",
    editable: false,
    immediatelyRender: false,
  });

  if (!editor) {
    return <Box sx={{ minHeight: 120 }} />;
  }

  return <EditorContent editor={editor} />;
}
