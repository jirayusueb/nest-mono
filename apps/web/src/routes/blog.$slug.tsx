import { createFileRoute } from "@tanstack/react-router";
import { PostDetailPage } from "~/pages/blog-page";

export const Route = createFileRoute("/blog/$slug")({
  component: PostDetailPage,
});
