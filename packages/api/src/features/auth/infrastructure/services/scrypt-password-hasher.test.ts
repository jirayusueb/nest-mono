import { describe, expect, test } from "vitest";
import { ScryptPasswordHasher } from "./scrypt-password-hasher";

describe("ScryptPasswordHasher", () => {
  test("roundtrips a password", async () => {
    const hasher = new ScryptPasswordHasher();
    const stored = await hasher.hash("correct horse");
    expect(await hasher.verify("correct horse", stored)).toBe(true);
    expect(await hasher.verify("wrong", stored)).toBe(false);
  });

  test("malformed stored value verifies as false, never throws", async () => {
    const hasher = new ScryptPasswordHasher();
    expect(await hasher.verify("x", "garbage")).toBe(false);
    expect(await hasher.verify("x", "")).toBe(false);
  });
});
