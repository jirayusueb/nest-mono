import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import Button from "@mui/material/Button";
import { HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import React from "react";

import { UiProvider } from "@nest-mono/ui";

import { SessionProvider, useSession } from "~/entities/user";
import { authClient } from "~/shared/auth";

import { QueryProvider } from "./query-provider";

function Header() {
  const { user, setUser } = useSession();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 24px",
        borderBottom: "1px solid rgba(0,0,0,0.12)",
      }}
    >
      <Link to="/" style={{ textDecoration: "none", fontWeight: 600 }}>
        nest-mono
      </Link>
      <span style={{ flex: 1 }} />
      {user ? (
        <>
          {user.role === "admin" ? (
            <Button component={Link} to="/admin" size="small">
              Admin
            </Button>
          ) : null}
          <span>{user.name}</span>
          <Button
            size="small"
            onClick={() => {
              void authClient.signOut().then(() => setUser(null));
            }}
          >
            Sign out
          </Button>
        </>
      ) : (
        <Button component={Link} to="/auth" size="small">
          Sign in
        </Button>
      )}
    </header>
  );
}

export function RootDocument() {
  const emotionCache = createCache({ key: "css" });

  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <CacheProvider value={emotionCache}>
          <UiProvider>
            <QueryProvider>
              <SessionProvider>
                <Header />
                <Outlet />
              </SessionProvider>
            </QueryProvider>
          </UiProvider>
        </CacheProvider>
        <Scripts />
      </body>
    </html>
  );
}
