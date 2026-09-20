import type { UserId } from "../../../../shared/kernel/types/ids";
import { AppError } from "../../../../shared/kernel/errors/app-error";
import { err, ok } from "../../../../shared/kernel/types/result";
import type { Result } from "../../../../shared/kernel/types/result";
import type { UserEntity } from "../../domain/entities/user-entity";
import type { IUserRepository } from "../ports/i-user-repository";

export class GetUserUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(input: {
    userId: UserId;
  }): Promise<Result<UserEntity, AppError>> {
    const user = await this.repo.findById(input.userId);

    if (user === null) {
      return err(AppError.notFound("User"));
    }

    return ok(user);
  }
}
