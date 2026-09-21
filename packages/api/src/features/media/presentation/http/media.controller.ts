import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { ConfirmMediaUseCase } from "~/features/media/application/usecases/confirm-media";
import { CreateUploadTargetUseCase } from "~/features/media/application/usecases/create-upload-target";
import { DeleteMediaUseCase } from "~/features/media/application/usecases/delete-media";
import { ListMediaUseCase } from "~/features/media/application/usecases/list-media";
import type { SessionUser } from "~/shared/kernel/types/session-user";
import { CurrentUser } from "~/shared/presentation/http/current-user.decorator";
import { SessionGuard } from "~/shared/presentation/http/session.guard";

import type {
  ConfirmMediaResponse,
  MediaListResponse,
  UploadTargetResponse,
} from "./dtos/media-response";
import {
  confirmMediaSchema,
  mediaKeyParamSchema,
  uploadTargetSchema,
  type ConfirmMediaRequest,
  type UploadTargetRequest,
} from "./dtos/media-schemas";
import { MediaMappers } from "./mappers/media-mappers";

@Controller("media")
@UseGuards(SessionGuard)
export class MediaController {
  constructor(
    @Inject(CreateUploadTargetUseCase)
    private readonly createUploadTarget: CreateUploadTargetUseCase,
    @Inject(ConfirmMediaUseCase)
    private readonly confirmMedia: ConfirmMediaUseCase,
    @Inject(ListMediaUseCase) private readonly listMedia: ListMediaUseCase,
    @Inject(DeleteMediaUseCase)
    private readonly deleteMedia: DeleteMediaUseCase,
  ) {}

  @Post("target")
  @HttpCode(201)
  async createTarget(
    @Body({ schema: uploadTargetSchema }) body: UploadTargetRequest,
    @CurrentUser() identity: SessionUser,
  ): Promise<UploadTargetResponse> {
    const result = await this.createUploadTarget.execute(
      MediaMappers.toCreateUploadTargetInput(body, identity.id),
    );

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }

  @Post("confirm")
  async confirm(
    @Body({ schema: confirmMediaSchema }) body: ConfirmMediaRequest,
    @CurrentUser() identity: SessionUser,
  ): Promise<ConfirmMediaResponse> {
    const result = await this.confirmMedia.execute(
      MediaMappers.toConfirmMediaInput(body, identity.id),
    );

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }

  @Get()
  async list(@CurrentUser() identity: SessionUser): Promise<MediaListResponse> {
    return MediaMappers.toMediaListResponse(
      await this.listMedia.execute({ userId: identity.id }),
    );
  }

  @Delete(":key")
  @HttpCode(204)
  async remove(
    @Param("key", { schema: mediaKeyParamSchema }) key: string,
    @CurrentUser() identity: SessionUser,
  ): Promise<void> {
    const result = await this.deleteMedia.execute(
      MediaMappers.toDeleteMediaInput(key, identity.id),
    );

    if (result.isErr()) {
      throw result.error;
    }
  }
}
