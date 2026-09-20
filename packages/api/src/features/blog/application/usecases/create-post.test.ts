import { describe, expect, it } from "vitest";
import {
  mockDateProvider,
  mockIdGenerator,
  mockUnitOfWork,
} from "../../../../shared/application/testing/mocks";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { make } from "../../../../shared/kernel/types/brand";
import { SlugVO } from "../../domain/values/slug-vo";
import { CreatePostUseCase } from "./create-post";
import { mockPostRepository, storedPost } from "../testing/mocks";

const NOW = new Date("2026-01-01T00:00:00.000Z");

const USER_ID = make<UserId>("u1");

function setup() {
  const { repo, posts } = mockPostRepository();

  const useCase = new CreatePostUseCase(
    repo,
    mockIdGenerator(),
    mockDateProvider(NOW),
    mockUnitOfWork(),
  );

  return { posts, useCase };
}

describe("create post", () => {
  it("creates a post with a derived slug, category, tags, and thumbnail", async () => {
    const { posts, useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      title: "Weekend Wrap",
      content: "# Hi\n\nworld",
      category: "News",
      tags: ["first", "Weekly Notes"],
      thumbnailUrl: "https://cdn.example.com/a.png",
    });

    expect(result.isOk()).toBe(true);
    const dto = result.unwrap();
    expect(dto.slug).toBe("weekend-wrap");
    expect(dto.category).toEqual({ name: "News", slug: "news" });
    expect(dto.tags).toEqual([
      { name: "first", slug: "first" },
      { name: "Weekly Notes", slug: "weekly-notes" },
    ]);
    expect(dto.thumbnailUrl).toBe("https://cdn.example.com/a.png");
    expect(dto.createdAt.toISOString()).toBe(NOW.toISOString());
    expect(posts).toHaveLength(1);
  });

  it("suffixes the slug when it is already taken", async () => {
    const { posts, useCase } = setup();
    posts.push(storedPost({ slug: SlugVO.restore("weekend-wrap") }));

    const result = await useCase.execute({
      userId: USER_ID,
      title: "Weekend Wrap",
      content: "",
      tags: [],
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().slug).toBe("weekend-wrap-2");
  });

  it("rejects a title no slug can be derived from", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      title: "///",
      content: "",
      tags: [],
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("DomainError");
  });

  it("rejects an invalid category name", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      title: "Weekend Wrap",
      content: "",
      category: "",
      tags: [],
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("DomainError");
  });

  it("rejects tags that collapse to the same slug", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      title: "Weekend Wrap",
      content: "",
      tags: ["News", "news"],
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("DomainError");
  });
});
