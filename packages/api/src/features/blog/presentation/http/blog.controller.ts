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
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  type PaginatedResponse,
} from "../../../../shared/application/dtos/pagination";
import type { SessionUser } from "../../../../shared/kernel/types/session-user";
import { AdminGuard } from "../../../../shared/presentation/http/admin.guard";
import { CurrentUser } from "../../../../shared/presentation/http/current-user.decorator";
import { SessionGuard } from "../../../../shared/presentation/http/session.guard";
import { CreatePostUseCase } from "../../application/usecases/create-post";
import { DeletePostUseCase } from "../../application/usecases/delete-post";
import { GetPostBySlugUseCase } from "../../application/usecases/get-post-by-slug";
import { ListCategoriesUseCase } from "../../application/usecases/list-categories";
import { ListPostsUseCase } from "../../application/usecases/list-posts";
import { UpdatePostUseCase } from "../../application/usecases/update-post";
import type {
  CategoryListResponse,
  PostResponse,
} from "./dtos/blog-response";
import { BlogMappers } from "./mappers/blog-mappers";
import {
  createPostSchema,
  idSchema,
  listPostsQuerySchema,
  slugParamSchema,
  updatePostSchema,
  type CreatePostRequest,
  type ListPostsRequest,
  type UpdatePostRequest,
} from "./dtos/blog-schemas";

@Controller("api/posts")
export class BlogController {
  constructor(
    @Inject(ListPostsUseCase) private readonly listPosts: ListPostsUseCase,
    @Inject(ListCategoriesUseCase)
    private readonly listCategories: ListCategoriesUseCase,
    @Inject(GetPostBySlugUseCase)
    private readonly getPostBySlug: GetPostBySlugUseCase,
    @Inject(CreatePostUseCase) private readonly createPost: CreatePostUseCase,
    @Inject(UpdatePostUseCase) private readonly updatePost: UpdatePostUseCase,
    @Inject(DeletePostUseCase) private readonly deletePost: DeletePostUseCase,
  ) {}

  @Get()
  async list(
    @Query({ schema: listPostsQuerySchema }) query: ListPostsRequest,
  ): Promise<PaginatedResponse<PostResponse>> {
    const result = await this.listPosts.execute(query);

    return { ...result, items: result.items.map(BlogMappers.toPostResponse) };
  }

  @Get("categories")
  async categories(): Promise<CategoryListResponse> {
    return this.listCategories.execute();
  }

  @Get(":slug")
  async getBySlug(
    @Param("slug", { schema: slugParamSchema }) slug: string,
  ): Promise<PostResponse> {
    const result = await this.getPostBySlug.execute({ slug });

    if (result.isErr()) {
      throw result.error;
    }

    return BlogMappers.toPostResponse(result.value);
  }

  @Post()
  @UseGuards(SessionGuard, AdminGuard)
  @HttpCode(201)
  async create(
    @Body({ schema: createPostSchema }) body: CreatePostRequest,
    @CurrentUser() identity: SessionUser,
  ): Promise<PostResponse> {
    const result = await this.createPost.execute(
      BlogMappers.toCreatePostInput(body, identity.id),
    );

    if (result.isErr()) {
      throw result.error;
    }

    return BlogMappers.toPostResponse(result.value);
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(
    @Param("id", { schema: idSchema }) id: string,
    @Body({ schema: updatePostSchema }) body: UpdatePostRequest,
    @CurrentUser() identity: SessionUser,
  ): Promise<PostResponse> {
    const result = await this.updatePost.execute(
      BlogMappers.toUpdatePostInput(body, id, identity.id),
    );

    if (result.isErr()) {
      throw result.error;
    }

    return BlogMappers.toPostResponse(result.value);
  }

  @Delete(":id")
  @UseGuards(SessionGuard)
  @HttpCode(204)
  async remove(
    @Param("id", { schema: idSchema }) id: string,
    @CurrentUser() identity: SessionUser,
  ): Promise<void> {
    const result = await this.deletePost.execute(
      BlogMappers.toDeletePostInput(id, identity.id),
    );

    if (result.isErr()) {
      throw result.error;
    }
  }
}
