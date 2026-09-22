import type { PostEntity } from "~/features/blog/domain/entities/post-entity";
import type { CategoryVO } from "~/features/blog/domain/values/category-vo";
import type {
  PaginatedRequest,
  PaginatedResponse,
} from "~/shared/application/dtos/pagination";
import type { PostId, UserId } from "~/shared/kernel/types/ids";

export abstract class IPostRepository {
  abstract list(request: PaginatedRequest): Promise<PaginatedResponse<PostEntity>>;
  abstract findBySlug(slug: string): Promise<PostEntity | null>;
  abstract findByIdForUser(postId: PostId, userId: UserId): Promise<PostEntity | null>;
  abstract slugExists(slug: string): Promise<boolean>;
  abstract save(post: PostEntity): Promise<void>;
  abstract delete(postId: PostId, userId: UserId, deletedAt: Date): Promise<void>;
  abstract listCategories(): Promise<CategoryVO[]>;
}
