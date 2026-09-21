import { describe, expect, it } from "vitest";

import {
  mockPostRepository,
  storedPost,
} from "~/features/blog/application/testing/mocks";
import {
  mockDateProvider,
  mockUnitOfWork,
} from "~/shared/application/testing/mocks";
import { make } from "~/shared/kernel/types/brand";
import type { PostId, UserId } from "~/shared/kernel/types/ids";

import { DeletePostUseCase } from "./delete-post";

const NOW = new Date("2026-01-02T00:00:00.000Z");

const POST_ID = make<PostId>("p1");

const USER_ID = make<UserId>("u1");

const OTHER_USER = make<UserId>("u2");

const PAGE = { page: 1, limit: 20 };

function setup() {
  const { repo, posts } = mockPostRepository([storedPost()]);

  const useCase = new DeletePostUseCase(
    repo,
    mockDateProvider(NOW),
    mockUnitOfWork(),
  );

  return { repo, posts, useCase };
}

describe("delete post", () => {
  it("keeps the record but hides it from reads", async () => {
    const { repo, posts, useCase } = setup();

    const result = await useCase.execute({
      postId: POST_ID,
      userId: USER_ID,
    });

    expect(result.isOk()).toBe(true);
    expect(posts).toHaveLength(1);
    expect(posts[0].deletedAt).toEqual(NOW);
    expect((await repo.list(PAGE)).total).toBe(0);
    expect(await repo.findBySlug("buy-milk")).toBeNull();
  });

  it("frees the slug for reuse", async () => {
    const { repo, posts, useCase } = setup();

    expect(await repo.slugExists("buy-milk")).toBe(true);

    await useCase.execute({ postId: POST_ID, userId: USER_ID });

    expect(await repo.slugExists("buy-milk")).toBe(false);
  });

  it("refuses to delete another author's post", async () => {
    const { repo, posts, useCase } = setup();

    const result = await useCase.execute({
      postId: POST_ID,
      userId: OTHER_USER,
    });

    expect(result.isErr() && result.error.code).toBe("NotFound");
    expect(posts[0].deletedAt).toBeNull();
  });

  it("refuses to delete an already deleted post", async () => {
    const { useCase } = setup();

    await useCase.execute({ postId: POST_ID, userId: USER_ID });

    const again = await useCase.execute({
      postId: POST_ID,
      userId: USER_ID,
    });

    expect(again.isErr() && again.error.code).toBe("NotFound");
  });
});
