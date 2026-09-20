import { Module } from "@nestjs/common";
import { ID_GENERATOR, type IIdGenerator } from "../../shared/application/interfaces/i-id-generator";
import { UNIT_OF_WORK, type IUnitOfWork } from "../../shared/application/interfaces/i-unit-of-work";
import { DATE_PROVIDER, type IDateProvider } from "../../shared/application/interfaces/i-date-provider";
import { CreatePostUseCase } from "./application/usecases/create-post";
import { DeletePostUseCase } from "./application/usecases/delete-post";
import { GetPostBySlugUseCase } from "./application/usecases/get-post-by-slug";
import { ListCategoriesUseCase } from "./application/usecases/list-categories";
import { ListPostsUseCase } from "./application/usecases/list-posts";
import { UpdatePostUseCase } from "./application/usecases/update-post";
import { POST_REPOSITORY, type IPostRepository } from "./application/ports/i-post-repository";
import { DrizzleBlogRepository } from "./infrastructure/repositories/drizzle-blog-repository";
import { BlogController } from "./presentation/http/blog.controller";

@Module({
  controllers: [BlogController],
  providers: [
    { provide: POST_REPOSITORY, useClass: DrizzleBlogRepository },
    {
      provide: ListPostsUseCase,
      useFactory: (repo: IPostRepository) => new ListPostsUseCase(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: ListCategoriesUseCase,
      useFactory: (repo: IPostRepository) => new ListCategoriesUseCase(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: GetPostBySlugUseCase,
      useFactory: (repo: IPostRepository) => new GetPostBySlugUseCase(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: CreatePostUseCase,
      useFactory: (
        repo: IPostRepository,
        ids: IIdGenerator,
        clock: IDateProvider,
        uow: IUnitOfWork,
      ) => new CreatePostUseCase(repo, ids, clock, uow),
      inject: [POST_REPOSITORY, ID_GENERATOR, DATE_PROVIDER, UNIT_OF_WORK],
    },
    {
      provide: UpdatePostUseCase,
      useFactory: (
        repo: IPostRepository,
        clock: IDateProvider,
        uow: IUnitOfWork,
      ) => new UpdatePostUseCase(repo, clock, uow),
      inject: [POST_REPOSITORY, DATE_PROVIDER, UNIT_OF_WORK],
    },
    {
      provide: DeletePostUseCase,
      useFactory: (
        repo: IPostRepository,
        clock: IDateProvider,
        uow: IUnitOfWork,
      ) => new DeletePostUseCase(repo, clock, uow),
      inject: [POST_REPOSITORY, DATE_PROVIDER, UNIT_OF_WORK],
    },
  ],
})
export class BlogModule {}
