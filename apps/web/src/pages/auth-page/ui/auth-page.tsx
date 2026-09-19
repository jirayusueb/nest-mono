"use client";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Form, Page } from "@nest-mono/ui";
import { Result } from "better-result";
import { authClient } from "~/shared/auth";
import { useSession } from "~/entities/user";

export function AuthPage() {
  const navigate = useNavigate({ from: "/auth" });
  const { setUser } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const input = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };

    setError(null);

    const result = await Result.tryPromise({
      try: () =>
        mode === "signin"
          ? authClient.signInEmail(input)
          : authClient.signUpEmail(input),
      catch: (cause) =>
        cause instanceof Error ? cause.message : "Authentication failed",
    });

    if (result.isErr()) {
      setError(result.error);

      return;
    }

    setUser(result.value);
    void navigate({ to: "/" });
  }

  return (
    <Page>
      <Page.Header>
        <Page.Title>
          {mode === "signin" ? "Sign in" : "Create an account"}
        </Page.Title>
      </Page.Header>
      <Form onSubmit={(event) => void handleSubmit(event)}>
        {mode === "signup" ? (
          <Form.Field name="name" label="Name" required />
        ) : null}
        <Form.Field name="email" label="Email" type="email" required />
        <Form.Field
          name="password"
          label="Password"
          type="password"
          required
          slotProps={{ htmlInput: { minLength: 8 } }}
        />
        <Form.Submit>{mode === "signin" ? "Sign in" : "Sign up"}</Form.Submit>
      </Form>
      <Typography variant="body2" sx={{ mt: 2 }}>
        {mode === "signin" ? "No account yet? " : "Already registered? "}
        <Button
          size="small"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </Button>
      </Typography>
      {error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : null}
    </Page>
  );
}
