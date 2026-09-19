import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import { Category } from "../../domain/values/category";
import { Slug } from "../../domain/values/slug";
import { Tag } from "../../domain/values/tag";
import { PostTitle } from "../../domain/values/post-title";
import { Post, type PostProps } from "../../domain/entities/post";
import type { IPostRepository } from "../ports/i-post-repository";

export function storedPost(overrides: Partial<PostProps> = {}): Post {
  // SAFETY: fixture literals stand in for schema-issued ids.
  return Post.restore({
    id: "p1" as PostId,
    authorId: "u1" as UserId,
    title: PostTitle.restore("Buy milk"),
    slug: Slug.restore("buy-milk"),
    content: "**milk**",
    category: Category.restore("Home", "home"),
    tags: [Tag.restore("groceries", "groceries")],
    thumbnailUrl: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  });
}

export class MockPostRepository implements IPostRepository {
  posts: Post[] = [];

  async list(): Promise<Post[]> {
    return [...this.posts];
  }

  async findBySlug(slug: string): Promise<Post | null> {
    return this.posts.find((post) => post.slug === slug) ?? null;
  }

  async findByIdForUser(postId: PostId, userId: UserId): Promise<Post | null> {
    return (
      this.posts.find(
        (post) => post.id === postId && post.authorId === userId,
      ) ?? null
    );
  }

  async slugExists(slug: string): Promise<boolean> {
    return this.posts.some((post) => post.slug === slug);
  }

  async save(post: Post): Promise<void> {
    const existing = this.posts.findIndex((p) => p.id === post.id);

    if (existing === -1) {
      this.posts.push(post);
    } else {
      this.posts[existing] = post;
    }
  }

  async delete(postId: PostId, userId: UserId): Promise<void> {
    this.posts = this.posts.filter(
      (post) => !(post.id === postId && post.authorId === userId),
    );
  }

  async listCategories(): Promise<Category[]> {
    const bySlug = new Map<string, Category>();

    for (const post of this.posts) {
      if (post.category) {
        bySlug.set(post.category.slugValue, post.category);
      }
    }

    return [...bySlug.values()];
  }
}
