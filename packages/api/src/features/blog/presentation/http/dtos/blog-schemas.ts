import { z } from "zod";
import { MAX_CATEGORY_NAME_LENGTH } from "../../../domain/values/category";
import { MAX_TAG_NAME_LENGTH } from "../../../domain/values/tag";
import {
  MAX_POST_TITLE_LENGTH,
  MIN_POST_TITLE_LENGTH,
} from "../../../domain/values/post-title";

const tagName = z.string().min(1).max(MAX_TAG_NAME_LENGTH);

export const createPostSchema = z.object({
  title: z.string().min(MIN_POST_TITLE_LENGTH).max(MAX_POST_TITLE_LENGTH),
  content: z.string().max(20_000).default(""),
  category: z.string().min(1).max(MAX_CATEGORY_NAME_LENGTH).optional(),
  tags: z.array(tagName).max(10).default([]),
  thumbnailUrl: z.url().nullable().optional(),
});

export const updatePostSchema = z.object({
  title: z
    .string()
    .min(MIN_POST_TITLE_LENGTH)
    .max(MAX_POST_TITLE_LENGTH)
    .optional(),
  content: z.string().max(20_000).optional(),
  category: z
    .string()
    .min(1)
    .max(MAX_CATEGORY_NAME_LENGTH)
    .nullable()
    .optional(),
  tags: z.array(tagName).max(10).optional(),
  thumbnailUrl: z.url().nullable().optional(),
});

export const idSchema = z.uuid();

export const slugParamSchema = z.string().min(1).max(200);

export type CreatePostBody = z.infer<typeof createPostSchema>;

export type UpdatePostBody = z.infer<typeof updatePostSchema>;
