import { describe, expect, it } from "vitest";
import {
  mockDateProvider,
  mockUnitOfWork,
} from "../../../../shared/application/testing/mocks";
import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import { make } from "../../../../shared/kernel/types/brand";
import { UpdatePostUseCase } from "./update-post";
import { mockPostRepository, storedPost } from "../testing/mocks";

const NOW = new Date("2026-01-02T00:00:00.000Z");

const POST_ID = make<PostId>("p1");

const USER_ID = make<UserId>("u1");

const OTHER_USER = make<UserId>("u2");

function setup() {
  const { repo, posts } = mockPostRepository([storedPost()]);

  const useCase = new UpdatePostUseCase(
    repo,
    mockDateProvider(NOW),
    mockUnitOfWork(),
  );

  return { posts, useCase };
}

describe("update post", () => {
  it("rejects a post that does not exist for the caller", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: OTHER_USER,
      postId: POST_ID,
      title: "Nope",
    });

    expect(result.isErr()).toBe(true);
    expect(result.isErr() && result.error.code).toBe("NotFound");
  });

  it("updates content while keeping the slug immutable", async () => {
    const { posts, useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      postId: POST_ID,
      title: "Buy oat milk",
      content: "done **milk**",
    });

    expect(result.isOk()).toBe(true);
    const dto = result.unwrap();
    expect(dto.title).toBe("Buy oat milk");
    expect(dto.slug).toBe("buy-milk");
    expect(dto.content).toBe("done **milk**");
    expect(dto.updatedAt.toISOString()).toBe(NOW.toISOString());
    expect(dto.createdAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(posts[0]?.title.value).toBe("Buy oat milk");
  });

  it("clears the category and thumbnail on explicit null", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      postId: POST_ID,
      category: null,
      thumbnailUrl: null,
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().category).toBeNull();
    expect(result.unwrap().thumbnailUrl).toBeNull();
  });

  it("keeps the category and thumbnail when absent", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      postId: POST_ID,
      tags: ["urgent"],
    });

    expect(result.isOk()).toBe(true);
    const dto = result.unwrap();
    expect(dto.category).toEqual({ name: "Home", slug: "home" });
    expect(dto.thumbnailUrl).toBeNull();
  });

  it("sets a thumbnail when provided", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      userId: USER_ID,
      postId: POST_ID,
      thumbnailUrl: "https://cdn.example.com/b.png",
    });

    expect(result.isOk()).toBe(true);
    expect(result.unwrap().thumbnailUrl).toBe("https://cdn.example.com/b.png");
  });
});
