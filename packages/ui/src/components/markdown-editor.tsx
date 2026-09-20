"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import ImageExt from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { useRef } from "react";

export interface MarkdownEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  uploadImage?: (file: File) => Promise<string>;
}

interface ToolbarAction {
  label: string;
  title: string;
  run: (editor: Editor) => void;
}

const TOOLBAR: ToolbarAction[] = [
  {
    label: "B",
    title: "Bold",
    run: (e) => e.chain().focus().toggleBold().run(),
  },
  {
    label: "I",
    title: "Italic",
    run: (e) => e.chain().focus().toggleItalic().run(),
  },
  {
    label: "H2",
    title: "Heading",
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "•",
    title: "Bullet list",
    run: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "</>",
    title: "Code block",
    run: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
];

export function MarkdownEditor({
  value,
  onChange,
  uploadImage,
}: MarkdownEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, ImageExt, Markdown],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
  });

  if (!editor) {
    return <Box sx={{ minHeight: 120 }} />;
  }

  const handleFile = async (file: File | undefined) => {
    if (!file || !uploadImage) {
      return;
    }

    const url = await uploadImage(file);
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          p: 0.5,
          display: "flex",
          gap: 0.5,
        }}
      >
        {TOOLBAR.map((action) => (
          <Tooltip key={action.title} title={action.title}>
            <IconButton size="small" onClick={() => action.run(editor)}>
              {action.label}
            </IconButton>
          </Tooltip>
        ))}
        {uploadImage ? (
          <Tooltip title="Insert image">
            <IconButton size="small" onClick={() => fileInput.current?.click()}>
              IMG
            </IconButton>
          </Tooltip>
        ) : null}
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </Box>
      <EditorContent editor={editor} />
    </Box>
  );
}
