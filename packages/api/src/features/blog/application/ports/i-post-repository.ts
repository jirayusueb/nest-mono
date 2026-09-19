import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import type { Category } from "../../domain/values/category";
import type { Post } from "../../domain/entities/post";

export interface IPostRepository {
  list(): Promise<Post[]>;
  findBySlug(slug: string): Promise<Post | null>;
  findByIdForUser(postId: PostId, userId: UserId): Promise<Post | null>;
  slugExists(slug: string): Promise<boolean>;
  save(post: Post): Promise<void>;
  delete(postId: PostId, userId: UserId): Promise<void>;
  listCategories(): Promise<Category[]>;
}
