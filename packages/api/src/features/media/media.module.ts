import { Module } from "@nestjs/common";
import type { IDateProvider } from "../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../shared/application/interfaces/i-id-generator";
import {
  BUCKET_STORE,
  DATE_PROVIDER,
  ID_GENERATOR,
  MEDIA_REPOSITORY,
} from "../../shared/tokens";
import { ConfirmMedia } from "./application/usecases/confirm-media";
import { CreateUploadTarget } from "./application/usecases/create-upload-target";
import { DeleteMedia } from "./application/usecases/delete-media";
import { ListMedia } from "./application/usecases/list-media";
import type { IBucketStore } from "./application/ports/i-bucket-store";
import type { IMediaRepository } from "./application/ports/i-media-repository";
import { RustFsBucketStore } from "./infrastructure/bucket-store";
import { DrizzleMediaRepository } from "./infrastructure/repositories/drizzle-media-repository";
import { MediaController } from "./presentation/http/media.controller";

@Module({
  controllers: [MediaController],
  providers: [
    { provide: BUCKET_STORE, useClass: RustFsBucketStore },
    { provide: MEDIA_REPOSITORY, useClass: DrizzleMediaRepository },
    {
      provide: CreateUploadTarget,
      useFactory: (
        repo: IMediaRepository,
        store: IBucketStore,
        ids: IIdGenerator,
        dates: IDateProvider,
      ) => new CreateUploadTarget(repo, store, ids, dates),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE, ID_GENERATOR, DATE_PROVIDER],
    },
    {
      provide: ConfirmMedia,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new ConfirmMedia(repo, store),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE],
    },
    {
      provide: ListMedia,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new ListMedia(repo, store),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE],
    },
    {
      provide: DeleteMedia,
      useFactory: (repo: IMediaRepository, store: IBucketStore) =>
        new DeleteMedia(repo, store),
      inject: [MEDIA_REPOSITORY, BUCKET_STORE],
    },
  ],
})
export class MediaModule {}
