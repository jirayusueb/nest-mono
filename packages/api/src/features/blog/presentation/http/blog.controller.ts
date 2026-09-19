import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { make } from "../../../../shared/kernel/types/brand";
import type { PostId } from "../../../../shared/kernel/types/ids";
import type { SessionUser } from "../../../../shared/kernel/types/session-user";
import { CurrentUser } from "../../../../shared/presentation/http/current-user.decorator";
import { SessionGuard } from "../../../../shared/presentation/http/session.guard";
import { CreatePost } from "../../application/usecases/create-post";
import { DeletePost } from "../../application/usecases/delete-post";
import { GetPostBySlug } from "../../application/usecases/get-post-by-slug";
import { ListCategories } from "../../application/usecases/list-categories";
import { ListPosts } from "../../application/usecases/list-posts";
import { UpdatePost } from "../../application/usecases/update-post";
import {
  toPostResponse,
  type CategoryResponse,
  type PostResponse,
} from "./dtos/blog-response";
import {
  createPostSchema,
  idSchema,
  slugParamSchema,
  updatePostSchema,
  type CreatePostBody,
  type UpdatePostBody,
} from "./dtos/blog-schemas";

/** Reads are public; writes are session-guarded per route. */
@Controller("api/posts")
export class BlogController {
  constructor(
    @Inject(ListPosts) private readonly listPosts: ListPosts,
    @Inject(ListCategories) private readonly listCategories: ListCategories,
    @Inject(GetPostBySlug) private readonly getPostBySlug: GetPostBySlug,
    @Inject(CreatePost) private readonly createPost: CreatePost,
    @Inject(UpdatePost) private readonly updatePost: UpdatePost,
    @Inject(DeletePost) private readonly deletePost: DeletePost,
  ) {}

  @Get()
  async list(): Promise<{ posts: PostResponse[] }> {
    const result = await this.listPosts.execute();

    if (result.isErr()) {
      throw result.error;
    }

    return { posts: result.value.posts.map(toPostResponse) };
  }

  @Get("categories")
  async categories(): Promise<{ categories: CategoryResponse[] }> {
    const result = await this.listCategories.execute();

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }

  @Get(":slug")
  async getBySlug(
    @Param("slug", { schema: slugParamSchema }) slug: string,
  ): Promise<PostResponse> {
    const result = await this.getPostBySlug.execute({ slug });

    if (result.isErr()) {
      throw result.error;
    }

    return toPostResponse(result.value);
  }

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(201)
  async create(
    @Body({ schema: createPostSchema }) body: CreatePostBody,
    @CurrentUser() identity: SessionUser,
  ): Promise<PostResponse> {
    const result = await this.createPost.execute({
      ...body,
      userId: identity.id,
    });

    if (result.isErr()) {
      throw result.error;
    }

    return toPostResponse(result.value);
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(
    @Param("id", { schema: idSchema }) id: string,
    @Body({ schema: updatePostSchema }) body: UpdatePostBody,
    @CurrentUser() identity: SessionUser,
  ): Promise<PostResponse> {
    const result = await this.updatePost.execute({
      ...body,
      postId: make<PostId>(id),
      userId: identity.id,
    });

    if (result.isErr()) {
      throw result.error;
    }

    return toPostResponse(result.value);
  }

  @Delete(":id")
  @UseGuards(SessionGuard)
  @HttpCode(204)
  async remove(
    @Param("id", { schema: idSchema }) id: string,
    @CurrentUser() identity: SessionUser,
  ): Promise<void> {
    const result = await this.deletePost.execute({
      postId: make<PostId>(id),
      userId: identity.id,
    });

    if (result.isErr()) {
      throw result.error;
    }
  }
}
