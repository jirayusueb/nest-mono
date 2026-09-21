import type {
  ConfirmMediaInput,
  CreateUploadTargetInput,
  DeleteMediaInput,
  ListMediaOutput,
  MediaOutput,
} from "~/features/media/application/dtos/media-dtos";
import type {
  MediaItemResponse,
  MediaListResponse,
} from "~/features/media/presentation/http/dtos/media-response";
import type {
  ConfirmMediaRequest,
  UploadTargetRequest,
} from "~/features/media/presentation/http/dtos/media-schemas";
import type { UserId } from "~/shared/kernel/types/ids";

export class MediaMappers {
  static toMediaItemResponse(dto: MediaOutput): MediaItemResponse {
    return { ...dto, createdAt: dto.createdAt.toISOString() };
  }

  static toMediaListResponse(output: ListMediaOutput): MediaListResponse {
    return {
      media: output.media.map(MediaMappers.toMediaItemResponse),
    };
  }

  static toCreateUploadTargetInput(
    body: UploadTargetRequest,
    userId: UserId,
  ): CreateUploadTargetInput {
    return { ...body, userId };
  }

  static toConfirmMediaInput(
    body: ConfirmMediaRequest,
    userId: UserId,
  ): ConfirmMediaInput {
    return { key: body.key, userId };
  }

  static toDeleteMediaInput(key: string, userId: UserId): DeleteMediaInput {
    return { key, userId };
  }
}
