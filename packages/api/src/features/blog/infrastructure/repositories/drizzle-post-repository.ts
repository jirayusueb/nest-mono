import { Inject, Injectable } from "@nestjs/common";
import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import type { IPostRepository } from "~/features/blog/application/ports/i-post-repository";
import type { PostEntity } from "~/features/blog/domain/entities/post-entity";
import { CategoryVO } from "~/features/blog/domain/values/category-vo";
import {
  PostMapper,
  type TagRefRow,
} from "~/features/blog/infrastructure/mappers/post-mapper";
import {
  offsetOf,
  toPaginatedResponse,
  type PaginatedRequest,
  type PaginatedResponse,
} from "~/shared/application/dtos/pagination";
import { IDateProvider } from "~/shared/application/interfaces/i-date-provider";
import { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";
import {
  DATABASE,
  type Database,
  type Tx,
} from "~/shared/infrastructure/db/database";
import {
  category as categoryTable,
  tag as tagTable,
  post as postTable,
  postTag,
} from "~/shared/infrastructure/db/schema/blog";
import { activeDb } from "~/shared/infrastructure/db/tx-storage";
import { AppError } from "~/shared/kernel/errors/app-error";
import type { PostId, UserId } from "~/shared/kernel/types/ids";

const SORTABLE: Record<string, PgColumn> = {
  createdAt: postTable.createdAt,
  updatedAt: postTable.updatedAt,
  title: postTable.title,
};

@Injectable()
export class DrizzlePostRepository implements IPostRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(IIdGenerator) private readonly ids: IIdGenerator,
    @Inject(IDateProvider) private readonly clock: IDateProvider,
  ) {}

  private get dbOrTx(): Database {
    return activeDb(this.db);
  }

  async list(
    request: PaginatedRequest,
  ): Promise<PaginatedResponse<PostEntity>> {
    const direction = request.sortOrder === "asc" ? asc : desc;
    const column = SORTABLE[request.sortBy ?? ""] ?? postTable.createdAt;

    const rows = await this.dbOrTx
      .select({ post: postTable, category: categoryTable })
      .from(postTable)
      .leftJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
      .where(isNull(postTable.deletedAt))
      .orderBy(direction(column))
      .limit(request.limit)
      .offset(offsetOf(request));

    const totals = await this.dbOrTx
      .select({ value: count() })
      .from(postTable)
      .where(isNull(postTable.deletedAt));

    // SAFETY: ids come from our own schema; branded ids restore without
    // revalidation.
    const tagRows = await this.tagsFor(
      rows.map((row) => row.post.id as PostId),
    );

    const items = rows.map((row) =>
      PostMapper.toDomain(
        row.post,
        row.category,
        tagRows.get(row.post.id) ?? [],
      ),
    );

    return toPaginatedResponse(items, totals[0].value, request);
  }

  async findBySlug(slug: string): Promise<PostEntity | null> {
    const rows = await this.dbOrTx
      .select({ post: postTable, category: categoryTable })
      .from(postTable)
      .leftJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
      .where(and(eq(postTable.slug, slug), isNull(postTable.deletedAt)))
      .limit(1);

    const row = rows[0];

    if (!row) {
      return null;
    }

    // SAFETY: ids come from our own schema; branded ids restore without
    // revalidation.
    const tagRows = await this.tagsFor([row.post.id as PostId]);

    return PostMapper.toDomain(
      row.post,
      row.category,
      tagRows.get(row.post.id) ?? [],
    );
  }

  async findByIdForUser(
    postId: PostId,
    userId: UserId,
  ): Promise<PostEntity | null> {
    const rows = await this.dbOrTx
      .select({ post: postTable, category: categoryTable })
      .from(postTable)
      .leftJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
      .where(and(eq(postTable.id, postId), isNull(postTable.deletedAt)))
      .limit(1);

    const row = rows[0];

    if (!row || row.post.authorId !== userId) {
      return null;
    }

    const tagRows = await this.tagsFor([postId]);

    return PostMapper.toDomain(
      row.post,
      row.category,
      tagRows.get(postId) ?? [],
    );
  }

  async slugExists(slug: string): Promise<boolean> {
    const rows = await this.dbOrTx
      .select({ id: postTable.id })
      .from(postTable)
      .where(and(eq(postTable.slug, slug), isNull(postTable.deletedAt)))
      .limit(1);

    return rows.length > 0;
  }

  async save(entity: PostEntity): Promise<void> {
    await this.dbOrTx.transaction(async (tx) => {
      const categoryId = entity.category
        ? await this.resolveBySlug(tx, categoryTable, {
            id: this.ids.generate(),
            name: entity.category.name,
            slug: entity.category.slugValue,
            createdAt: this.clock.now(),
            updatedAt: this.clock.now(),
          })
        : null;

      const tagIds: string[] = [];

      for (const tag of entity.tags) {
        tagIds.push(
          await this.resolveBySlug(tx, tagTable, {
            id: this.ids.generate(),
            name: tag.name,
            slug: tag.slugValue,
            createdAt: this.clock.now(),
            updatedAt: this.clock.now(),
          }),
        );
      }

      try {
        await tx
          .insert(postTable)
          .values({
            id: entity.id,
            authorId: entity.authorId,
            title: entity.title.value,
            slug: entity.slug.value,
            content: entity.content,
            thumbnailUrl: entity.thumbnailUrl,
            categoryId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            deletedAt: entity.deletedAt,
          })
          .onConflictDoUpdate({
            target: postTable.id,
            set: {
              title: entity.title.value,
              content: entity.content,
              thumbnailUrl: entity.thumbnailUrl,
              categoryId,
              updatedAt: entity.updatedAt,
              deletedAt: entity.deletedAt,
            },
          });
      } catch (error) {
        // SAFETY: postgres driver errors carry a string `code`; 23505 is
        // unique_violation.
        if (
          error instanceof Error &&
          (error as { code?: string }).code === "23505"
        ) {
          throw AppError.conflict("Post slug already exists");
        }

        throw error;
      }

      await tx.delete(postTag).where(eq(postTag.postId, entity.id));

      if (tagIds.length > 0) {
        await tx
          .insert(postTag)
          .values(tagIds.map((tagId) => ({ postId: entity.id, tagId })))
          .onConflictDoNothing();
      }
    });
  }

  async delete(postId: PostId, userId: UserId, deletedAt: Date): Promise<void> {
    await this.dbOrTx
      .update(postTable)
      .set({ deletedAt, updatedAt: deletedAt })
      .where(
        and(
          eq(postTable.id, postId),
          eq(postTable.authorId, userId),
          isNull(postTable.deletedAt),
        ),
      );
  }

  async listCategories(): Promise<CategoryVO[]> {
    const rows = await this.dbOrTx
      .select({ name: categoryTable.name, slug: categoryTable.slug })
      .from(categoryTable)
      .orderBy(categoryTable.name);

    return rows.map((row) => CategoryVO.restore(row.name, row.slug));
  }

  private async resolveBySlug(
    tx: Tx,
    table: typeof categoryTable | typeof tagTable,
    values: {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      updatedAt: Date;
    },
  ): Promise<string> {
    const rows = await tx
      .insert(table)
      .values(values)
      .onConflictDoUpdate({
        target: table.slug,
        set: { name: values.name, updatedAt: values.updatedAt },
      })
      .returning({ id: table.id });

    return rows[0].id;
  }

  private async tagsFor(postIds: PostId[]): Promise<Map<string, TagRefRow[]>> {
    const byPost = new Map<string, TagRefRow[]>();

    if (postIds.length === 0) {
      return byPost;
    }

    const rows = await this.dbOrTx
      .select({
        postId: postTag.postId,
        name: tagTable.name,
        slug: tagTable.slug,
      })
      .from(postTag)
      .innerJoin(tagTable, eq(postTag.tagId, tagTable.id))
      .where(inArray(postTag.postId, postIds));

    for (const row of rows) {
      const list = byPost.get(row.postId) ?? [];
      list.push({ name: row.name, slug: row.slug });
      byPost.set(row.postId, list);
    }

    return byPost;
  }
}
