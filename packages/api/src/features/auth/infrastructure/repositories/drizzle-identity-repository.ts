import { Inject, Injectable } from "@nestjs/common";
import { and, eq, type SQL } from "drizzle-orm";
import { account, user } from "../../../../db/schema/auth";
import type { UserId } from "../../../../shared/kernel/types/ids";
import type { Database } from "../../../../shared/infrastructure/database/database";
import { DATABASE } from "../../../../shared/tokens";
import type { Email } from "../../../../shared/kernel/values/email";
import type {
  AuthIdentity,
  IIdentityRepository,
  NewIdentity,
} from "../../application/ports/i-identity-repository";
import {
  IdentityMapper,
  type AccountRow,
  type UserRow,
} from "../mappers/identity-mapper";

export interface IdentityJoinRow {
  user: UserRow;
  account: AccountRow | null;
}

@Injectable()
export class DrizzleIdentityRepository implements IIdentityRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findByEmail(email: Email): Promise<AuthIdentity | null> {
    return this.findOneBy(eq(user.email, email.value));
  }

  async findById(id: UserId): Promise<AuthIdentity | null> {
    return this.findOneBy(eq(user.id, id));
  }

  async emailExists(email: Email): Promise<boolean> {
    const rows = await this.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.value))
      .limit(1);

    return rows.length > 0;
  }

  async createWithCredential(input: NewIdentity): Promise<AuthIdentity> {
    await this.db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: input.userId,
        name: input.name,
        email: input.email,
        createdAt: input.now,
        updatedAt: input.now,
      });
      await tx.insert(account).values({
        id: input.accountId,
        userId: input.userId,
        accountId: input.userId,
        providerId: "credential",
        password: input.passwordHash,
        createdAt: input.now,
        updatedAt: input.now,
      });
    });

    return {
      id: input.userId,
      name: input.name,
      email: input.email,
      image: null,
      emailVerified: false,
      passwordHash: input.passwordHash,
    };
  }

  private async findOneBy(condition: SQL): Promise<AuthIdentity | null> {
    const rows: IdentityJoinRow[] = await this.db
      .select({ user, account })
      .from(user)
      .leftJoin(
        account,
        and(eq(account.userId, user.id), eq(account.providerId, "credential")),
      )
      .where(condition)
      .limit(1);

    return rows[0]
      ? IdentityMapper.toDomain(rows[0].user, rows[0].account)
      : null;
  }
}
