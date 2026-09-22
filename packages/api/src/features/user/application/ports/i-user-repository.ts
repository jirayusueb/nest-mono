import type { UserEntity } from "~/features/user/domain/entities/user-entity";
import type { UserId } from "~/shared/kernel/types/ids";
import type { EmailVO } from "~/shared/kernel/values/email-vo";

export interface NewUser {
  id: UserId;
  name: string;
  email: EmailVO;
  now: Date;
}

export abstract class IUserRepository {
  abstract findById(userId: UserId): Promise<UserEntity | null>;
  abstract findByEmail(email: EmailVO): Promise<UserEntity | null>;
  abstract emailExists(email: EmailVO): Promise<boolean>;
  abstract create(input: NewUser): Promise<UserEntity>;
}
