import type { IDateProvider } from "../../../../shared/application/interfaces/i-date-provider";
import type { IUnitOfWork } from "../../../../shared/application/interfaces/i-unit-of-work";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { DeletePostInput } from "../dtos/blog-dtos";
import type { IPostRepository } from "../ports/i-post-repository";

export class DeletePostUseCase {
  constructor(
    private readonly repo: IPostRepository,
    private readonly clock: IDateProvider,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(input: DeletePostInput): Promise<Result<void, AppError>> {
    return this.uow.runInTransaction(async () => {
      const existing = await this.repo.findByIdForUser(
        input.postId,
        input.userId,
      );

      if (existing === null) {
        return err(AppError.notFound("Post"));
      }

      await this.repo.delete(input.postId, input.userId, this.clock.now());

      return ok(undefined);
    });
  }
}
