import { createMock, type DeepMocked } from "@golevelup/ts-vitest";

import type { IPostRepository } from "~/features/blog/application/ports/i-post-repository";
import { PostEntity } from "~/features/blog/domain/entities/post-entity";
import { CategoryVO } from "~/features/blog/domain/values/category-vo";
import { PostTitleVO } from "~/features/blog/domain/values/post-title-vo";
import { SlugVO } from "~/features/blog/domain/values/slug-vo";
import { TagVO } from "~/features/blog/domain/values/tag-vo";
import {
  offsetOf,
  toPaginatedResponse,
} from "~/shared/application/dtos/pagination";
import type { PostId, UserId } from "~/shared/kernel/types/ids";

interface StoredPostOverrides {
  id?: PostId;
  authorId?: UserId;
  title?: PostTitleVO;
  slug?: SlugVO;
  content?: string;
  category?: CategoryVO | null;
  tags?: TagVO[];
  thumbnailUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export function storedPost(overrides: StoredPostOverrides = {}): PostEntity {
  // SAFETY: fixture literals stand in for schema-issued ids.
  const p = {
    id: "p1" as PostId,
    authorId: "u1" as UserId,
    title: PostTitleVO.restore("Buy milk"),
    slug: SlugVO.restore("buy-milk"),
    content: "**milk**",
    category: CategoryVO.restore("Home", "home"),
    tags: [TagVO.restore("groceries", "groceries")],
    thumbnailUrl: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };

  return PostEntity.restore(
    p.id,
    p.authorId,
    p.title,
    p.slug,
    p.content,
    p.category,
    p.tags,
    p.thumbnailUrl,
    p.createdAt,
    p.updatedAt,
    p.deletedAt,
  );
}

export interface MockPostRepo {
  repo: DeepMocked<IPostRepository>;
  posts: PostEntity[];
}

export function mockPostRepository(seed: PostEntity[] = []): MockPostRepo {
  const posts = [...seed];

  const live = (): PostEntity[] => posts.filter((post) => !post.isDeleted());

  const repo = createMock<IPostRepository>({
    list: async (request) => {
      const rows = live();
      const start = offsetOf(request);

      return toPaginatedResponse(
        rows.slice(start, start + request.limit),
        rows.length,
        request,
      );
    },
    findBySlug: async (slug) =>
      live().find((post) => post.slug.value === slug) ?? null,
    findByIdForUser: async (postId, userId) =>
      live().find((post) => post.id === postId && post.authorId === userId) ??
      null,
    slugExists: async (slug) => live().some((post) => post.slug.value === slug),
    save: async (post) => {
      const index = posts.findIndex((p) => p.id === post.id);

      if (index === -1) {
        posts.push(post);
      } else {
        posts[index] = post;
      }
    },
    delete: async (postId, userId, deletedAt) => {
      const index = posts.findIndex(
        (post) => post.id === postId && post.authorId === userId,
      );

      if (index !== -1) {
        posts[index] = posts[index].delete(deletedAt);
      }
    },
    listCategories: async () => {
      const bySlug = new Map<string, CategoryVO>();

      for (const post of posts) {
        if (post.category) {
          bySlug.set(post.category.slugValue, post.category);
        }
      }

      return [...bySlug.values()];
    },
  });

  return { repo, posts };
}
