import type { UserEntity } from "../../../domain/entities/user-entity";
import type { UserResponse } from "../dtos/user-response";

export class UserMappers {
  static toUserResponse(user: UserEntity): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
