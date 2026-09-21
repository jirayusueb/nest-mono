import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getRequest } from "@tanstack/react-start/server";

import { authClient } from "~/shared/auth";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const init: RequestInit = {};

    if (typeof document === "undefined") {
      const cookie = getRequest().headers.get("cookie");

      if (cookie) {
        init.headers = { cookie };
      }
    }

    const user = await authClient.getSession(init);

    if (!user) {
      throw redirect({ to: "/auth" });
    }

    if (user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: Outlet,
});
