import type { Email } from "../../../../shared/kernel/values/email";
import type { UserId } from "../../../../shared/kernel/types/ids";

export interface AuthIdentity {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  /** Null when the account has no credential (e.g. social-only). */
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
  findByEmail(email: Email): Promise<AuthIdentity | null>;
  findById(id: UserId): Promise<AuthIdentity | null>;
  emailExists(email: Email): Promise<boolean>;
  createWithCredential(input: NewIdentity): Promise<AuthIdentity>;
}
