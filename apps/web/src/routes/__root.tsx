/// <reference types="vite/client" />
import { createRootRoute } from "@tanstack/react-router";

import { RootDocument } from "~/app/shell/root-document";

export const Route = createRootRoute({
  component: RootDocument,
});
