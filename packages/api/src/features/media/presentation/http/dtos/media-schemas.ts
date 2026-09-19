import { z } from "zod";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
} from "../../../domain/media-rules";

export const uploadTargetSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export const confirmMediaSchema = z.object({
  key: z.string().min(1),
});

export type UploadTargetBody = z.infer<typeof uploadTargetSchema>;

export type ConfirmMediaBody = z.infer<typeof confirmMediaSchema>;
