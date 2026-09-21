import { PostEntity } from "~/features/blog/domain/entities/post-entity";
import { CategoryVO } from "~/features/blog/domain/values/category-vo";
import { PostTitleVO } from "~/features/blog/domain/values/post-title-vo";
import { SlugVO } from "~/features/blog/domain/values/slug-vo";
import { TagVO } from "~/features/blog/domain/values/tag-vo";
import type { category, post } from "~/shared/infrastructure/db/schema/blog";
import type { PostId, UserId } from "~/shared/kernel/types/ids";

export type PostRow = typeof post.$inferSelect;

export type CategoryRow = typeof category.$inferSelect;

export type TagRefRow = { name: string; slug: string };

export class PostMapper {
  static toDomain(
    postRow: PostRow,
    categoryRow: CategoryRow | null,
    tagRows: TagRefRow[],
  ): PostEntity {
    // SAFETY: rows come from our own schema; branded ids restore without
    // revalidation.
    return PostEntity.restore(
      postRow.id as PostId,
      postRow.authorId as UserId,
      PostTitleVO.restore(postRow.title),
      SlugVO.restore(postRow.slug),
      postRow.content,
      categoryRow === null
        ? null
        : CategoryVO.restore(categoryRow.name, categoryRow.slug),
      tagRows.map((row) => TagVO.restore(row.name, row.slug)),
      postRow.thumbnailUrl,
      postRow.createdAt,
      postRow.updatedAt,
      postRow.deletedAt,
    );
  }
}
