import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import type { PostEntity } from "../../domain/entities/post-entity";

export interface PostOutput {
  id: string;
  slug: string;
  title: string;
  content: string;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  userId: UserId;
  title: string;
  content: string;
  category?: string;
  tags: string[];
  thumbnailUrl?: string | null;
}

export interface UpdatePostInput {
  userId: UserId;
  postId: PostId;
  title?: string;
  content?: string;
  category?: string | null;
  tags?: string[];
  thumbnailUrl?: string | null;
}

export interface GetPostBySlugInput {
  slug: string;
}

export interface DeletePostInput {
  postId: PostId;
  userId: UserId;
}

export interface CategoryOutput {
  name: string;
  slug: string;
}

export interface ListCategoriesOutput {
  categories: CategoryOutput[];
}

export function toPostOutput(post: PostEntity): PostOutput {
  return {
    id: post.id,
    slug: post.slug.value,
    title: post.title.value,
    content: post.content,
    category:
      post.category === null
        ? null
        : { name: post.category.name, slug: post.category.slugValue },
    tags: post.tags.map((tag) => ({
      name: tag.name,
      slug: tag.slugValue,
    })),
    thumbnailUrl: post.thumbnailUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}
