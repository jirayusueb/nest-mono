import type { MediaDto } from "../../../application/dtos/media-dtos";

export interface UploadTargetResponse {
  key: string;
  uploadUrl: string;
  url: string;
}

export interface MediaItemResponse {
  key: string;
  url: string;
  contentType: string;
  bytes: number;
  createdAt: string;
}

export function toMediaItemResponse(dto: MediaDto): MediaItemResponse {
  return { ...dto, createdAt: dto.createdAt.toISOString() };
}
