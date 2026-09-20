import type { EmailVO } from "../../../../shared/kernel/values/email-vo";
import type { UserId } from "../../../../shared/kernel/types/ids";

export const IDENTITY_REPOSITORY = "IDENTITY_REPOSITORY";

export interface AuthIdentity {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  passwordHash: string | null;
}

export interface NewIdentity {
  userId: UserId;
  accountId: string;
  email: string;
  name: string;
  passwordHash: string;
  now: Date;
}

export interface IIdentityRepository {
  findByEmail(email: EmailVO): Promise<AuthIdentity | null>;
  findById(id: UserId): Promise<AuthIdentity | null>;
  emailExists(email: EmailVO): Promise<boolean>;
  createWithCredential(input: NewIdentity): Promise<AuthIdentity>;
}
