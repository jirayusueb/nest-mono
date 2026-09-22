import { Module } from "@nestjs/common";

import { IDateProvider } from "~/shared/application/interfaces/i-date-provider";
import { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";
import { IUnitOfWork } from "~/shared/application/interfaces/i-unit-of-work";

import { IPostRepository } from "./application/ports/i-post-repository";
import { CreatePostUseCase } from "./application/usecases/create-post";
import { DeletePostUseCase } from "./application/usecases/delete-post";
import { GetPostBySlugUseCase } from "./application/usecases/get-post-by-slug";
import { ListCategoriesUseCase } from "./application/usecases/list-categories";
import { ListPostsUseCase } from "./application/usecases/list-posts";
import { UpdatePostUseCase } from "./application/usecases/update-post";
import { DrizzlePostRepository } from "./infrastructure/repositories/drizzle-post-repository";
import { PostController } from "./presentation/http/post.controller";

@Module({
  controllers: [PostController],
  providers: [
    { provide: IPostRepository, useClass: DrizzlePostRepository },
    {
      provide: ListPostsUseCase,
      useFactory: (repo: IPostRepository) => new ListPostsUseCase(repo),
      inject: [IPostRepository],
    },
    {
      provide: ListCategoriesUseCase,
      useFactory: (repo: IPostRepository) => new ListCategoriesUseCase(repo),
      inject: [IPostRepository],
    },
    {
      provide: GetPostBySlugUseCase,
      useFactory: (repo: IPostRepository) => new GetPostBySlugUseCase(repo),
      inject: [IPostRepository],
    },
    {
      provide: CreatePostUseCase,
      useFactory: (
        repo: IPostRepository,
        ids: IIdGenerator,
        clock: IDateProvider,
        uow: IUnitOfWork,
      ) => new CreatePostUseCase(repo, ids, clock, uow),
      inject: [IPostRepository, IIdGenerator, IDateProvider, IUnitOfWork],
    },
    {
      provide: UpdatePostUseCase,
      useFactory: (
        repo: IPostRepository,
        clock: IDateProvider,
        uow: IUnitOfWork,
      ) => new UpdatePostUseCase(repo, clock, uow),
      inject: [IPostRepository, IDateProvider, IUnitOfWork],
    },
    {
      provide: DeletePostUseCase,
      useFactory: (
        repo: IPostRepository,
        clock: IDateProvider,
        uow: IUnitOfWork,
      ) => new DeletePostUseCase(repo, clock, uow),
      inject: [IPostRepository, IDateProvider, IUnitOfWork],
    },
  ],
})
export class BlogModule {}
