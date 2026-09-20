import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { IPasswordHasher } from "../../application/ports/i-password-hasher";
import { Result } from "../../../../shared/kernel/types/result";

const KEY_LENGTH = 64;

@Injectable()
export class ScryptPasswordHasher implements IPasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = scryptSync(plain, salt, KEY_LENGTH);

    return `${salt.toString("base64")}:${hash.toString("base64")}`;
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const compared = Result.try({
      try: () => {
        const [saltPart, hashPart] = stored.split(":");
        const salt = Buffer.from(saltPart, "base64");
        const expected = Buffer.from(hashPart, "base64");

        return timingSafeEqual(
          scryptSync(plain, salt, expected.length),
          expected,
        );
      },
      // Unparseable stored value compares as a mismatch (port contract).
      catch: () => null,
    });

    return compared.match({ ok: (equal) => equal, err: () => false });
  }
}
