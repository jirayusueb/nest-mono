import type { EmailVO } from "../../../../shared/kernel/values/email-vo";
import type { UserId } from "../../../../shared/kernel/types/ids";
import type { UserEntity } from "../../domain/entities/user-entity";

export const USER_REPOSITORY = "USER_REPOSITORY";

export interface NewUser {
  id: UserId;
  name: string;
  email: EmailVO;
  now: Date;
}

export interface IUserRepository {
  findById(userId: UserId): Promise<UserEntity | null>;
  findByEmail(email: EmailVO): Promise<UserEntity | null>;
  emailExists(email: EmailVO): Promise<boolean>;
  create(input: NewUser): Promise<UserEntity>;
}
