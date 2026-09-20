import { z } from "zod";
import { MAX_CATEGORY_NAME_LENGTH } from "../../../domain/values/category-vo";
import { MAX_TAG_NAME_LENGTH } from "../../../domain/values/tag-vo";
import { MAX_TAGS_PER_POST } from "../../../domain/rules/post-rules";
import {
  MAX_POST_TITLE_LENGTH,
  MIN_POST_TITLE_LENGTH,
} from "../../../domain/values/post-title-vo";

const tagName = z.string().min(1).max(MAX_TAG_NAME_LENGTH);

export const createPostSchema = z.object({
  title: z.string().min(MIN_POST_TITLE_LENGTH).max(MAX_POST_TITLE_LENGTH),
  content: z.string().max(20_000).default(""),
  category: z.string().min(1).max(MAX_CATEGORY_NAME_LENGTH).optional(),
  tags: z.array(tagName).max(MAX_TAGS_PER_POST).default([]),
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
  tags: z.array(tagName).max(MAX_TAGS_PER_POST).optional(),
  thumbnailUrl: z.url().nullable().optional(),
});

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const idSchema = z.uuid();

export const slugParamSchema = z.string().min(1).max(200);

export type CreatePostRequest = z.infer<typeof createPostSchema>;

export type UpdatePostRequest = z.infer<typeof updatePostSchema>;

export type ListPostsRequest = z.infer<typeof listPostsQuerySchema>;
