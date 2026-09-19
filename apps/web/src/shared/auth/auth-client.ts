import { apiFetch, type User } from "~/shared/api";

interface EmailPasswordInput {
  name?: string;
  email: string;
  password: string;
}

/** better-auth-style surface over the hand-rolled /api/auth routes. */
export const authClient = {
  async signUpEmail(input: EmailPasswordInput): Promise<User> {
    const body = await apiFetch<{ user: User }>("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify(input),
    });

    return body.user;
  },

  async signInEmail(input: EmailPasswordInput): Promise<User> {
    const body = await apiFetch<{ user: User }>("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify(input),
    });

    return body.user;
  },

  async signOut(): Promise<void> {
    await apiFetch("/api/auth/sign-out", { method: "POST" });
  },

  async getSession(): Promise<User | null> {
    const body = await apiFetch<{ user: User } | null>("/api/auth/get-session");

    return body?.user ?? null;
  },
};
