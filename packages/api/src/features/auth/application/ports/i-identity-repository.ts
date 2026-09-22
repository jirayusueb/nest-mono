import type { UserId } from "~/shared/kernel/types/ids";
import type { EmailVO } from "~/shared/kernel/values/email-vo";

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

export abstract class IIdentityRepository {
  abstract findByEmail(email: EmailVO): Promise<AuthIdentity | null>;
  abstract findById(id: UserId): Promise<AuthIdentity | null>;
  abstract emailExists(email: EmailVO): Promise<boolean>;
  abstract createWithCredential(input: NewIdentity): Promise<AuthIdentity>;
}
