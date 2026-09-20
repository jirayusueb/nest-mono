import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import type { SessionUser } from "../../../../shared/kernel/types/session-user";
import { CurrentUser } from "../../../../shared/presentation/http/current-user.decorator";
import { SessionGuard } from "../../../../shared/presentation/http/session.guard";
import { GetUserUseCase } from "../../application/usecases/get-user";
import type { UserResponse } from "./dtos/user-response";
import { UserMappers } from "./mappers/user-mappers";

@Controller("api/user")
@UseGuards(SessionGuard)
export class UserController {
  constructor(
    @Inject(GetUserUseCase) private readonly getUser: GetUserUseCase,
  ) {}

  @Get("me")
  async me(@CurrentUser() identity: SessionUser): Promise<UserResponse> {
    const result = await this.getUser.execute({ userId: identity.id });

    if (result.isErr()) {
      throw result.error;
    }

    return UserMappers.toUserResponse(result.value);
  }
}
