import type { UserId } from "../../../../shared/kernel/types/ids";

export interface MediaRecord {
  id: string;
  userId: UserId;
  key: string;
  contentType: string;
  bytes: number;
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUploadTargetInput {
  userId: UserId;
  contentType: string;
  bytes: number;
}

export interface UploadTargetOutput {
  key: string;
  uploadUrl: string;
  url: string;
}

export interface MediaOutput {
  key: string;
  url: string;
  contentType: string;
  bytes: number;
  createdAt: Date;
}

export interface ConfirmMediaInput {
  userId: UserId;
  key: string;
}

export interface ConfirmMediaOutput {
  url: string;
}

export interface DeleteMediaInput {
  userId: UserId;
  key: string;
}

export interface ListMediaInput {
  userId: UserId;
}

export interface ListMediaOutput {
  media: MediaOutput[];
}
