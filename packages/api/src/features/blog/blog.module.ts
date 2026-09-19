import { Module } from "@nestjs/common";
import type { IDateProvider } from "../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../shared/application/interfaces/i-id-generator";
import {
  DATE_PROVIDER,
  ID_GENERATOR,
  POST_REPOSITORY,
} from "../../shared/tokens";
import { CreatePost } from "./application/usecases/create-post";
import { DeletePost } from "./application/usecases/delete-post";
import { GetPostBySlug } from "./application/usecases/get-post-by-slug";
import { ListCategories } from "./application/usecases/list-categories";
import { ListPosts } from "./application/usecases/list-posts";
import { UpdatePost } from "./application/usecases/update-post";
import type { IPostRepository } from "./application/ports/i-post-repository";
import { DrizzleBlogRepository } from "./infrastructure/repositories/drizzle-blog-repository";
import { BlogController } from "./presentation/http/blog.controller";

@Module({
  controllers: [BlogController],
  providers: [
    { provide: POST_REPOSITORY, useClass: DrizzleBlogRepository },
    {
      provide: ListPosts,
      useFactory: (repo: IPostRepository) => new ListPosts(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: ListCategories,
      useFactory: (repo: IPostRepository) => new ListCategories(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: GetPostBySlug,
      useFactory: (repo: IPostRepository) => new GetPostBySlug(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: CreatePost,
      useFactory: (
        repo: IPostRepository,
        ids: IIdGenerator,
        dates: IDateProvider,
      ) => new CreatePost(repo, ids, dates),
      inject: [POST_REPOSITORY, ID_GENERATOR, DATE_PROVIDER],
    },
    {
      provide: UpdatePost,
      useFactory: (repo: IPostRepository, dates: IDateProvider) =>
        new UpdatePost(repo, dates),
      inject: [POST_REPOSITORY, DATE_PROVIDER],
    },
    {
      provide: DeletePost,
      useFactory: (repo: IPostRepository) => new DeletePost(repo),
      inject: [POST_REPOSITORY],
    },
  ],
})
export class BlogModule {}
