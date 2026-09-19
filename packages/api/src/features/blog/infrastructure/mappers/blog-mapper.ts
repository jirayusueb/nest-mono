import type { category, post } from "../../../../db/schema/blog";
import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import { Post } from "../../domain/entities/post";
import { Category } from "../../domain/values/category";
import { Tag } from "../../domain/values/tag";
import { PostTitle } from "../../domain/values/post-title";
import { Slug } from "../../domain/values/slug";

export type PostRow = typeof post.$inferSelect;

export type CategoryRow = typeof category.$inferSelect;

export type TagRefRow = { name: string; slug: string };

export class BlogMapper {
  /** Persistence rows are a trusted source — restore only. */
  static toDomain(
    postRow: PostRow,
    categoryRow: CategoryRow | null,
    tagRows: TagRefRow[],
  ): Post {
    // SAFETY: rows come from our own schema; branded ids restore without
    // revalidation.
    return Post.restore({
      id: postRow.id as PostId,
      authorId: postRow.authorId as UserId,
      title: PostTitle.restore(postRow.title),
      slug: Slug.restore(postRow.slug),
      content: postRow.content,
      category:
        categoryRow === null
          ? null
          : Category.restore(categoryRow.name, categoryRow.slug),
      tags: tagRows.map((row) => Tag.restore(row.name, row.slug)),
      thumbnailUrl: postRow.thumbnailUrl,
      createdAt: postRow.createdAt,
      updatedAt: postRow.updatedAt,
    });
  }
}
