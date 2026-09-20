import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "../../../../shared/application/interfaces/i-id-generator";
import type { IUnitOfWork } from "../../../../shared/application/interfaces/i-unit-of-work";
import { make } from "../../../../shared/kernel/types/brand";
import type { PostId } from "../../../../shared/kernel/types/ids";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import { PostEntity } from "../../domain/entities/post-entity";
import { SlugVO } from "../../domain/values/slug-vo";
import {
  toPostOutput,
  type CreatePostInput,
  type PostOutput,
} from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

const MAX_SLUG_ATTEMPTS = 50;

export class CreatePostUseCase {
  constructor(
    private readonly repo: IPostRepository,
    private readonly ids: IIdGenerator,
    private readonly clock: IDateProvider,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(input: CreatePostInput): Promise<Result<PostOutput, AppError>> {
    return this.uow.runInTransaction(async () => {
      const derived = SlugVO.fromTitle(input.title);

      if (derived.isErr()) {
        return err(derived.error);
      }

      const base = derived.value.value;

      let slug: string | null = null;

      for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
        const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;

        if (!(await this.repo.slugExists(candidate))) {
          slug = candidate;
          break;
        }
      }

      if (slug === null) {
        return err(AppError.conflict("Could not derive a unique slug"));
      }

      const post = PostEntity.create({
        id: make<PostId>(this.ids.generate()),
        authorId: input.userId,
        title: input.title,
        slug,
        content: input.content,
        category: input.category ?? null,
        tags: input.tags,
        thumbnailUrl: input.thumbnailUrl ?? null,
        now: this.clock.now(),
      });

      if (post.isErr()) {
        return err(post.error);
      }

      await this.repo.save(post.value);

      return ok(toPostOutput(post.value));
    });
  }
}
