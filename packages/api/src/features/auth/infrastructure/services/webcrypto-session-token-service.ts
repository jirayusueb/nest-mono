import { Injectable } from "@nestjs/common";

import type { ISessionTokenService } from "~/features/auth/application/ports/i-session-token-service";

@Injectable()
export class WebCryptoSessionTokenService implements ISessionTokenService {
  async issue(): Promise<{ token: string; tokenHash: string }> {
    const bytes = crypto.getRandomValues(new Uint8Array(32));

    const token = btoa(String.fromCharCode(...bytes))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");

    return { token, tokenHash: await this.hash(token) };
  }

  async hash(raw: string): Promise<string> {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(raw),
    );

    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
}
