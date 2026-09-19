import type { PostId, UserId } from "../../../../shared/kernel/types/ids";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { IPostRepository } from "../ports/i-post-repository";

export class DeletePost {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: {
    postId: PostId;
    userId: UserId;
  }): Promise<Result<void, AppError>> {
    const existing = await this.repo.findByIdForUser(
      input.postId,
      input.userId,
    );

    if (existing === null) {
      return err(AppError.notFound("Post"));
    }

    await this.repo.delete(input.postId, input.userId);

    return ok(undefined);
  }
}
