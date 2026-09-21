import { Module } from "@nestjs/common";

import {
  DATE_PROVIDER,
  type IDateProvider,
} from "~/shared/application/interfaces/i-date-provider";
import {
  ID_GENERATOR,
  type IIdGenerator,
} from "~/shared/application/interfaces/i-id-generator";

import {
  BUCKET_STORE,
  type IBucketStore,
} from "./application/ports/i-bucket-store";
import {
  MEDIA_REPOSITORY,
  type IMediaRepository,
} from "./application/ports/i-media-repository";
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
    { provide: BUCKET_STORE, useClass: RustFsBucketStore },
    { provide: MEDIA_REPOSITORY, useClass: DrizzleMediaRepository },
    {
      provide: CreateUploadTargetUseCase,
      useFactory: (
        repo: IMediaRepository,
        store: IBucketStore,
        ids: IIdGenerator,
        dates: IDateProvider,
      ) => new CreateUploadTargetUseCase(repo, store, ids, dates),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE, ID_GENERATOR, DATE_PROVIDER],
    },
    {
      provide: ConfirmMediaUseCase,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new ConfirmMediaUseCase(repo, store),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE],
    },
    {
      provide: ListMediaUseCase,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new ListMediaUseCase(repo, store),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE],
    },
    {
      provide: DeleteMediaUseCase,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new DeleteMediaUseCase(repo, store),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE],
    },
  ],
})
export class MediaModule {}
