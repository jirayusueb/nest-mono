import { createFileRoute } from "@tanstack/react-router";
import { EditPostPage } from "~/pages/admin-page";

export const Route = createFileRoute("/admin/blog/$id/edit")({
  component: EditPostPage,
});
