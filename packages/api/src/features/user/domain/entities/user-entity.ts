import type { UserId } from "~/shared/kernel/types/ids";
import type { EmailVO } from "~/shared/kernel/values/email-vo";

export class UserEntity {
  private constructor(
    public readonly id: UserId,
    public readonly name: string,
    public readonly email: EmailVO,
    public readonly emailVerified: boolean,
    public readonly image: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static restore(
    id: UserId,
    name: string,
    email: EmailVO,
    emailVerified: boolean,
    image: string | null,
    createdAt: Date,
    updatedAt: Date,
  ): UserEntity {
    return new UserEntity(
      id,
      name,
      email,
      emailVerified,
      image,
      createdAt,
      updatedAt,
    );
  }
}
