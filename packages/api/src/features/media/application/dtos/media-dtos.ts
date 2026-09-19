import type { UserId } from "../../../../shared/kernel/types/ids";

export interface MediaRecord {
  id: string;
  userId: UserId;
  key: string;
  contentType: string;
  bytes: number;
  /** Flips once the browser's direct PUT is verified via a HEAD. */
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUploadTargetInput {
  userId: UserId;
  contentType: string;
  bytes: number;
}

export interface UploadTargetDto {
  key: string;
  uploadUrl: string;
  url: string;
}

export interface MediaDto {
  key: string;
  url: string;
  contentType: string;
  bytes: number;
  createdAt: Date;
}
