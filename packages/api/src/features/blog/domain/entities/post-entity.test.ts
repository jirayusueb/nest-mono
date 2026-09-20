import { describe, expect, it } from "vitest";
import { make } from "../../../../shared/kernel/types/brand";
import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import { MAX_TAGS_PER_POST } from "../rules/post-rules";
import { PostEntity } from "./post-entity";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const BASE = {
  id: make<PostId>("00000000-0000-4000-8000-000000000001"),
  authorId: make<UserId>("00000000-0000-4000-8000-000000000002"),
  title: "T",
  slug: "t",
  content: "",
  category: null,
  thumbnailUrl: null,
  now: NOW,
};

describe("PostEntity tags cap", () => {
  it("accepts at most MAX_TAGS_PER_POST tags", () => {
    const result = PostEntity.create({
      ...BASE,
      tags: Array.from({ length: MAX_TAGS_PER_POST }, (_, i) => `t${i}`),
    });

    expect(result.isOk()).toBe(true);
  });

  it("rejects more than MAX_TAGS_PER_POST tags", () => {
    const result = PostEntity.create({
      ...BASE,
      tags: Array.from({ length: MAX_TAGS_PER_POST + 1 }, (_, i) => `t${i}`),
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.message).toBe(
      `A post can have at most ${MAX_TAGS_PER_POST} tags`,
    );
  });
});

describe("PostEntity clock", () => {
  const LATER = new Date("2026-02-01T00:00:00.000Z");

  it("stamps createdAt and updatedAt from the injected now", () => {
    const result = PostEntity.create({ ...BASE, tags: [] });

    expect(result.isOk()).toBe(true);
    const post = result.unwrap();
    expect(post.createdAt).toBe(NOW);
    expect(post.updatedAt).toBe(NOW);
  });

  it("moves only updatedAt on update", () => {
    const created = PostEntity.create({ ...BASE, tags: [] });

    const updated = created.unwrap().update({ title: "T2" }, LATER);

    expect(updated.isOk()).toBe(true);
    const post = updated.unwrap();
    expect(post.createdAt).toBe(NOW);
    expect(post.updatedAt).toBe(LATER);
  });
});
