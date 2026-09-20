import { AppError } from "../../../../shared/kernel/errors/app-error";
import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import { err, ok, Result } from "../../../../shared/kernel/types/result";
import { DomainError } from "../../../../shared/kernel/errors/domain-error";
import { SlugVO } from "../values/slug-vo";
import { CategoryVO } from "../values/category-vo";
import { TagVO } from "../values/tag-vo";
import { MAX_TAGS_PER_POST } from "../rules/post-rules";
import { PostTitleVO } from "../values/post-title-vo";

export interface PostCreation {
  id: PostId;
  authorId: UserId;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  createdAt?: Date;
  now: Date;
}

export interface PostUpdate {
  title?: string;
  content?: string;
  category?: string | null;
  tags?: string[];
  thumbnailUrl?: string | null;
}

interface PostParts {
  title: PostTitleVO;
  slug: SlugVO;
  category: CategoryVO | null;
  tags: TagVO[];
}

export class PostEntity {
  constructor(
    public readonly id: PostId,
    public readonly authorId: UserId,
    public readonly title: PostTitleVO,
    public readonly slug: SlugVO,
    public readonly content: string,
    public readonly category: CategoryVO | null,
    public readonly tags: TagVO[],
    // ponytail: dangling URL if the media object is later deleted; switch to a
    // mediaId FK + join if that bites.
    public readonly thumbnailUrl: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  static create(input: PostCreation): Result<PostEntity, AppError> {
    const parts = PostEntity.validate(input);

    if (parts.isErr()) {
      return err(parts.error);
    }

    const { category, slug, tags, title } = parts.value;

    return ok(
      new PostEntity(
        input.id,
        input.authorId,
        title,
        slug,
        input.content,
        category,
        tags,
        input.thumbnailUrl,
        input.createdAt ?? input.now,
        input.now,
        null,
      ),
    );
  }

  private static validate(input: PostCreation): Result<PostParts, AppError> {
    if (input.tags.length > MAX_TAGS_PER_POST) {
      return err(
        new DomainError(`A post can have at most ${MAX_TAGS_PER_POST} tags`),
      );
    }

    const parsedCategory: Result<CategoryVO | null, AppError> =
      input.category === null ? ok(null) : CategoryVO.create(input.category);

    const parsed = Result.all([
      PostTitleVO.create(input.title),
      SlugVO.create(input.slug),
      parsedCategory,
      Result.all(input.tags.map((name) => TagVO.create(name))),
    ]);

    if (parsed.isErr()) {
      return err(parsed.error);
    }

    const [title, slug, category, tags] = parsed.value;

    const slugs = new Set(tags.map((tag) => tag.slugValue));

    if (slugs.size !== tags.length) {
      return err(new DomainError("Tags must be unique"));
    }

    return ok({ category, slug, tags, title });
  }
  update(input: PostUpdate, now: Date): Result<PostEntity, AppError> {
    return PostEntity.create({
      id: this.id,
      authorId: this.authorId,
      title: input.title ?? this.title.value,
      slug: this.slug.value,
      content: input.content ?? this.content,
      category:
        input.category === undefined
          ? (this.category?.name ?? null)
          : input.category,
      tags: input.tags ?? this.tags.map((tag) => tag.name),
      thumbnailUrl:
        input.thumbnailUrl === undefined
          ? this.thumbnailUrl
          : input.thumbnailUrl,
      createdAt: this.createdAt,
      now,
    });
  }

  static restore(
    id: PostId,
    authorId: UserId,
    title: PostTitleVO,
    slug: SlugVO,
    content: string,
    category: CategoryVO | null,
    tags: TagVO[],
    thumbnailUrl: string | null,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
  ): PostEntity {
    return new PostEntity(
      id,
      authorId,
      title,
      slug,
      content,
      category,
      tags,
      thumbnailUrl,
      createdAt,
      updatedAt,
      deletedAt,
    );
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  delete(now: Date): PostEntity {
    return new PostEntity(
      this.id,
      this.authorId,
      this.title,
      this.slug,
      this.content,
      this.category,
      this.tags,
      this.thumbnailUrl,
      this.createdAt,
      now,
      now,
    );
  }
}
