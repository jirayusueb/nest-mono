import { createFileRoute } from "@tanstack/react-router";

import { AdminPostsPage } from "~/pages/admin-page";

export const Route = createFileRoute("/admin/")({
  component: AdminPostsPage,
});
