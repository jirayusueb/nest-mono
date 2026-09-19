import { AppError } from "../../../../shared/kernel/errors/app-error";
import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { Slug } from "../values/slug";
import { Category } from "../values/category";
import { Tag } from "../values/tag";
import { PostTitle } from "../values/post-title";

export interface PostProps {
  id: PostId;
  authorId: UserId;
  title: PostTitle;
  slug: Slug;
  /** Markdown — plain string; length enforced at the zod edge. */
  content: string;
  category: Category | null;
  tags: Tag[];
  /**
   * ponytail: dangling URL if the media object is later deleted; switch to a
   * mediaId FK + join if that bites.
   */
  thumbnailUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  id: PostId;
  authorId: UserId;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  tags: string[];
  thumbnailUrl: string | null;
  now: Date;
  /**
   * Present when re-composing an existing post (update): keep original
   * creation.
   */
  createdAt?: Date;
}

/**
 * Patch: absent keeps current; `null` clears category/thumbnail. Slug is
 * immutable.
 */
export interface PostUpdate {
  title?: string;
  content?: string;
  category?: string | null;
  tags?: string[];
  thumbnailUrl?: string | null;
}

/** Two-factory write entity; the slug is immutable after create. */
export class Post {
  private constructor(private readonly props: PostProps) {}

  get id(): PostId {
    return this.props.id;
  }
  get authorId(): UserId {
    return this.props.authorId;
  }
  get title(): PostTitle {
    return this.props.title;
  }
  get slug(): string {
    return this.props.slug.value;
  }
  get content(): string {
    return this.props.content;
  }
  get category(): Category | null {
    return this.props.category;
  }
  get tags(): Tag[] {
    return this.props.tags;
  }
  get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: CreatePostInput): Result<Post, AppError> {
    const title = PostTitle.create(input.title);

    if (title.isErr()) {
      return err(title.error);
    }

    const slug = Slug.create(input.slug);

    if (slug.isErr()) {
      return err(slug.error);
    }

    let category: Category | null = null;

    if (input.category !== null) {
      const created = Category.create(input.category);

      if (created.isErr()) {
        return err(created.error);
      }

      category = created.value;
    }

    const tags: Tag[] = [];

    for (const raw of input.tags) {
      const created = Tag.create(raw);

      if (created.isErr()) {
        return err(created.error);
      }

      tags.push(created.value);
    }

    return ok(
      new Post({
        id: input.id,
        authorId: input.authorId,
        title: title.value,
        slug: slug.value,
        content: input.content,
        category,
        tags,
        thumbnailUrl: input.thumbnailUrl,
        createdAt: input.createdAt ?? input.now,
        updatedAt: input.now,
      }),
    );
  }
  update(input: PostUpdate, now: Date): Result<Post, AppError> {
    return Post.create({
      id: this.props.id,
      authorId: this.props.authorId,
      title: input.title ?? this.props.title.value,
      slug: this.props.slug.value,
      content: input.content ?? this.props.content,
      category:
        input.category === undefined
          ? (this.props.category?.name ?? null)
          : input.category,
      tags: input.tags ?? this.props.tags.map((tag) => tag.name),
      thumbnailUrl:
        input.thumbnailUrl === undefined
          ? this.props.thumbnailUrl
          : input.thumbnailUrl,
      now,
      createdAt: this.props.createdAt,
    });
  }

  static restore(props: PostProps): Post {
    return new Post(props);
  }
}
