import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import type { SessionUser } from "../../../../shared/kernel/types/session-user";
import { CurrentUser } from "../../../../shared/presentation/http/current-user.decorator";
import { SessionGuard } from "../../../../shared/presentation/http/session.guard";
import { GetUser } from "../../application/usecases/get-user";
import { toUserResponse, type UserResponse } from "./dtos/user-response";

@Controller("api/user")
@UseGuards(SessionGuard)
export class UserController {
  constructor(@Inject(GetUser) private readonly getUser: GetUser) {}

  /** The guard resolved the identity; the use case reads the full record. */
  @Get("me")
  async me(@CurrentUser() identity: SessionUser): Promise<UserResponse> {
    const result = await this.getUser.execute({ userId: identity.id });

    if (result.isErr()) {
      throw result.error;
    }

    return toUserResponse(result.value);
  }
}
