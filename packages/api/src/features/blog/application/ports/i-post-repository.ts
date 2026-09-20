import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import type {
  PaginatedRequest,
  PaginatedResponse,
} from "../../../../shared/application/dtos/pagination";
import type { CategoryVO } from "../../domain/values/category-vo";
import type { PostEntity } from "../../domain/entities/post-entity";

export const POST_REPOSITORY = "POST_REPOSITORY";

export interface IPostRepository {
  list(request: PaginatedRequest): Promise<PaginatedResponse<PostEntity>>;
  findBySlug(slug: string): Promise<PostEntity | null>;
  findByIdForUser(postId: PostId, userId: UserId): Promise<PostEntity | null>;
  slugExists(slug: string): Promise<boolean>;
  save(post: PostEntity): Promise<void>;
  delete(postId: PostId, userId: UserId, deletedAt: Date): Promise<void>;
  listCategories(): Promise<CategoryVO[]>;
}
