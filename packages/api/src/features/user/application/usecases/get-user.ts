import type { GetUserInput } from "~/features/user/application/dtos/user-dtos";
import type { IUserRepository } from "~/features/user/application/ports/i-user-repository";
import type { UserEntity } from "~/features/user/domain/entities/user-entity";
import { AppError } from "~/shared/kernel/errors/app-error";
import { err, ok } from "~/shared/kernel/types/result";
import type { Result } from "~/shared/kernel/types/result";

export class GetUserUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(input: GetUserInput): Promise<Result<UserEntity, AppError>> {
    const user = await this.repo.findById(input.userId);

    if (user === null) {
      return err(AppError.notFound("User"));
    }

    return ok(user);
  }
}
