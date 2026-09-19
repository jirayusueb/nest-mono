import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import type { Post } from "../../domain/entities/post";

export interface PostDto {
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
  /** `null` clears; absent keeps current. */
  category?: string | null;
  tags?: string[];
  thumbnailUrl?: string | null;
}

export function toPostDto(post: Post): PostDto {
  return {
    id: post.id,
    slug: post.slug,
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
