import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  category as categoryTable,
  tag as tagTable,
  post as postTable,
  postTag,
} from "../../../../db/schema/blog";
import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../../../shared/application/interfaces/i-id-generator";
import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import type {
  Database,
  Tx,
} from "../../../../shared/infrastructure/database/database";
import {
  DATABASE,
  DATE_PROVIDER,
  ID_GENERATOR,
} from "../../../../shared/tokens";
import type { Post } from "../../domain/entities/post";
import { Category } from "../../domain/values/category";
import type { IPostRepository } from "../../application/ports/i-post-repository";
import { BlogMapper, type TagRefRow } from "../mappers/blog-mapper";

@Injectable()
export class DrizzleBlogRepository implements IPostRepository {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(ID_GENERATOR) private readonly ids: IIdGenerator,
    @Inject(DATE_PROVIDER) private readonly clock: IDateProvider,
  ) {}

  async list(): Promise<Post[]> {
    const rows = await this.db
      .select({ post: postTable, category: categoryTable })
      .from(postTable)
      .leftJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
      .orderBy(desc(postTable.createdAt));

    // SAFETY: ids come from our own schema; branded ids restore without
    // revalidation.
    const tagRows = await this.tagsFor(
      rows.map((row) => row.post.id as PostId),
    );

    return rows.map((row) =>
      BlogMapper.toDomain(
        row.post,
        row.category,
        tagRows.get(row.post.id) ?? [],
      ),
    );
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const rows = await this.db
      .select({ post: postTable, category: categoryTable })
      .from(postTable)
      .leftJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
      .where(eq(postTable.slug, slug))
      .limit(1);

    const row = rows[0];

    if (!row) {
      return null;
    }

    // SAFETY: ids come from our own schema; branded ids restore without
    // revalidation.
    const tagRows = await this.tagsFor([row.post.id as PostId]);

    return BlogMapper.toDomain(
      row.post,
      row.category,
      tagRows.get(row.post.id) ?? [],
    );
  }

  async findByIdForUser(postId: PostId, userId: UserId): Promise<Post | null> {
    const rows = await this.db
      .select({ post: postTable, category: categoryTable })
      .from(postTable)
      .leftJoin(categoryTable, eq(postTable.categoryId, categoryTable.id))
      .where(eq(postTable.id, postId))
      .limit(1);

    const row = rows[0];

    if (!row || row.post.authorId !== userId) {
      return null;
    }

    const tagRows = await this.tagsFor([postId]);

    return BlogMapper.toDomain(
      row.post,
      row.category,
      tagRows.get(postId) ?? [],
    );
  }

  async slugExists(slug: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: postTable.id })
      .from(postTable)
      .where(eq(postTable.slug, slug))
      .limit(1);

    return rows.length > 0;
  }

  async save(entity: Post): Promise<void> {
    await this.db.transaction(async (tx) => {
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

      await tx
        .insert(postTable)
        .values({
          id: entity.id,
          authorId: entity.authorId,
          title: entity.title.value,
          slug: entity.slug,
          content: entity.content,
          thumbnailUrl: entity.thumbnailUrl,
          categoryId,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        })
        .onConflictDoUpdate({
          target: postTable.id,
          set: {
            title: entity.title.value,
            content: entity.content,
            thumbnailUrl: entity.thumbnailUrl,
            categoryId,
            updatedAt: entity.updatedAt,
          },
        });

      await tx.delete(postTag).where(eq(postTag.postId, entity.id));

      if (tagIds.length > 0) {
        await tx
          .insert(postTag)
          .values(tagIds.map((tagId) => ({ postId: entity.id, tagId })))
          .onConflictDoNothing();
      }
    });
  }

  async delete(postId: PostId, userId: UserId): Promise<void> {
    await this.db
      .delete(postTable)
      .where(and(eq(postTable.id, postId), eq(postTable.authorId, userId)));
  }

  async listCategories(): Promise<Category[]> {
    const rows = await this.db
      .select({ name: categoryTable.name, slug: categoryTable.slug })
      .from(categoryTable)
      .orderBy(categoryTable.name);

    return rows.map((row) => Category.restore(row.name, row.slug));
  }

  /** Insert-or-alias by slug; returns the row id in one round trip. */
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

    const rows = await this.db
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
