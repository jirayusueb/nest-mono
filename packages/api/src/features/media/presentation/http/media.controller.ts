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
import type { SessionUser } from "../../../../shared/kernel/types/session-user";
import { CurrentUser } from "../../../../shared/presentation/http/current-user.decorator";
import { SessionGuard } from "../../../../shared/presentation/http/session.guard";
import { ConfirmMedia } from "../../application/usecases/confirm-media";
import { CreateUploadTarget } from "../../application/usecases/create-upload-target";
import { DeleteMedia } from "../../application/usecases/delete-media";
import { ListMedia } from "../../application/usecases/list-media";
import type {
  MediaItemResponse,
  UploadTargetResponse,
} from "./dtos/media-response";
import { toMediaItemResponse } from "./dtos/media-response";
import {
  confirmMediaSchema,
  uploadTargetSchema,
  type ConfirmMediaBody,
  type UploadTargetBody,
} from "./dtos/media-schemas";

@Controller("api/media")
@UseGuards(SessionGuard)
export class MediaController {
  constructor(
    @Inject(CreateUploadTarget)
    private readonly createUploadTarget: CreateUploadTarget,
    @Inject(ConfirmMedia) private readonly confirmMedia: ConfirmMedia,
    @Inject(ListMedia) private readonly listMedia: ListMedia,
    @Inject(DeleteMedia) private readonly deleteMedia: DeleteMedia,
  ) {}

  /** Presigned PUT target; the browser uploads directly to RustFS. */
  @Post("target")
  @HttpCode(201)
  async createTarget(
    @Body({ schema: uploadTargetSchema }) body: UploadTargetBody,
    @CurrentUser() identity: SessionUser,
  ): Promise<UploadTargetResponse> {
    const result = await this.createUploadTarget.execute({
      ...body,
      userId: identity.id,
    });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }

  @Post("confirm")
  async confirm(
    @Body({ schema: confirmMediaSchema }) body: ConfirmMediaBody,
  ): Promise<{ url: string }> {
    const result = await this.confirmMedia.execute({ key: body.key });

    if (result.isErr()) {
      throw result.error;
    }

    return result.value;
  }

  @Get()
  async list(
    @CurrentUser() identity: SessionUser,
  ): Promise<{ media: MediaItemResponse[] }> {
    const result = await this.listMedia.execute({ userId: identity.id });

    if (result.isErr()) {
      throw result.error;
    }

    return { media: result.value.media.map(toMediaItemResponse) };
  }

  @Delete(":key")
  @HttpCode(204)
  async remove(@Param("key") key: string): Promise<void> {
    const result = await this.deleteMedia.execute({ key });

    if (result.isErr()) {
      throw result.error;
    }
  }
}
