import { Module } from "@nestjs/common";

import { IDateProvider } from "~/shared/application/interfaces/i-date-provider";
import { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";

import { IBucketStore } from "./application/ports/i-bucket-store";
import { IMediaRepository } from "./application/ports/i-media-repository";
import { ConfirmMediaUseCase } from "./application/usecases/confirm-media";
import { CreateUploadTargetUseCase } from "./application/usecases/create-upload-target";
import { DeleteMediaUseCase } from "./application/usecases/delete-media";
import { ListMediaUseCase } from "./application/usecases/list-media";
import { DrizzleMediaRepository } from "./infrastructure/repositories/drizzle-media-repository";
import { RustFsBucketStore } from "./infrastructure/stores/rust-fs-bucket-store";
import { MediaController } from "./presentation/http/media.controller";

@Module({
  controllers: [MediaController],
  providers: [
    { provide: IBucketStore, useClass: RustFsBucketStore },
    { provide: IMediaRepository, useClass: DrizzleMediaRepository },
    {
      provide: CreateUploadTargetUseCase,
      useFactory: (
        repo: IMediaRepository,
        store: IBucketStore,
        ids: IIdGenerator,
        dates: IDateProvider,
      ) => new CreateUploadTargetUseCase(repo, store, ids, dates),
      inject: [IMediaRepository, IBucketStore, IIdGenerator, IDateProvider],
    },
    {
      provide: ConfirmMediaUseCase,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new ConfirmMediaUseCase(repo, store),
      inject: [IMediaRepository, IBucketStore],
    },
    {
      provide: ListMediaUseCase,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new ListMediaUseCase(repo, store),
      inject: [IMediaRepository, IBucketStore],
    },
    {
      provide: DeleteMediaUseCase,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new DeleteMediaUseCase(repo, store),
      inject: [IMediaRepository, IBucketStore],
    },
  ],
})
export class MediaModule {}
