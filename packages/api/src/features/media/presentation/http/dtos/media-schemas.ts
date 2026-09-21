import { z } from "zod";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "~/features/media/domain/rules/media-rules";

export const uploadTargetSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export const confirmMediaSchema = z.object({
  key: z.string().min(1),
});

export const mediaKeyParamSchema = z.string().min(1);

export type UploadTargetRequest = z.infer<typeof uploadTargetSchema>;

export type ConfirmMediaRequest = z.infer<typeof confirmMediaSchema>;
