import { createFileRoute } from "@tanstack/react-router";

import { NewPostPage } from "~/pages/admin-page";

export const Route = createFileRoute("/admin/blog/new")({
  component: NewPostPage,
});
