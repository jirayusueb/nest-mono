import type {
  CreatePostInput,
  DeletePostInput,
  PostOutput,
  UpdatePostInput,
} from "~/features/blog/application/dtos/blog-dtos";
import type { PostResponse } from "~/features/blog/presentation/http/dtos/blog-response";
import type {
  CreatePostRequest,
  UpdatePostRequest,
} from "~/features/blog/presentation/http/dtos/blog-schemas";
import { make } from "~/shared/kernel/types/brand";
import type { PostId, UserId } from "~/shared/kernel/types/ids";

export class PostMappers {
  static toPostResponse(dto: PostOutput): PostResponse {
    return {
      id: dto.id,
      slug: dto.slug,
      title: dto.title,
      content: dto.content,
      category: dto.category,
      tags: dto.tags,
      thumbnailUrl: dto.thumbnailUrl,
      createdAt: dto.createdAt.toISOString(),
      updatedAt: dto.updatedAt.toISOString(),
    };
  }

  static toCreatePostInput(
    body: CreatePostRequest,
    authorId: UserId,
  ): CreatePostInput {
    return { ...body, userId: authorId };
  }

  static toUpdatePostInput(
    body: UpdatePostRequest,
    id: string,
    authorId: UserId,
  ): UpdatePostInput {
    return { ...body, postId: make<PostId>(id), userId: authorId };
  }

  static toDeletePostInput(id: string, authorId: UserId): DeletePostInput {
    return { postId: make<PostId>(id), userId: authorId };
  }
}
