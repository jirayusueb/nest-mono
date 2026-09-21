import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import {
  USER_REPOSITORY,
  type IUserRepository,
} from "~/features/user/application/ports/i-user-repository";
import type { UserEntity } from "~/features/user/domain/entities/user-entity";
import { DATABASE, type Database } from "~/shared/infrastructure/db/database";
import { account } from "~/shared/infrastructure/db/schema/auth";
import { activeDb } from "~/shared/infrastructure/db/tx-storage";
import type { UserId } from "~/shared/kernel/types/ids";
import { EmailVO } from "~/shared/kernel/values/email-vo";

import type {
  AuthIdentity,
  IIdentityRepository,
  NewIdentity,
} from "./application/ports/i-identity-repository";

@Injectable()
export class IdentityRepositoryAdapter implements IIdentityRepository {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  private get dbOrTx(): Database {
    return activeDb(this.db);
  }

  async findByEmail(email: EmailVO): Promise<AuthIdentity | null> {
    return this.findOne(await this.users.findByEmail(email));
  }

  async findById(id: UserId): Promise<AuthIdentity | null> {
    return this.findOne(await this.users.findById(id));
  }

  async emailExists(email: EmailVO): Promise<boolean> {
    return this.users.emailExists(email);
  }

  async createWithCredential(input: NewIdentity): Promise<AuthIdentity> {
    const created = await this.users.create({
      id: input.userId,
      name: input.name,
      email: EmailVO.restore(input.email),
      now: input.now,
    });

    await this.dbOrTx.insert(account).values({
      id: input.accountId,
      userId: input.userId,
      accountId: input.userId,
      providerId: "credential",
      password: input.passwordHash,
      createdAt: input.now,
      updatedAt: input.now,
    });

    return this.toIdentity(created, input.passwordHash);
  }

  private async findOne(
    found: UserEntity | null,
  ): Promise<AuthIdentity | null> {
    if (found === null) {
      return null;
    }

    const rows = await this.dbOrTx
      .select({ password: account.password })
      .from(account)
      .where(
        and(eq(account.userId, found.id), eq(account.providerId, "credential")),
      )
      .limit(1);

    return this.toIdentity(found, rows[0]?.password ?? null);
  }

  private toIdentity(
    user: UserEntity,
    passwordHash: string | null,
  ): AuthIdentity {
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      image: user.image,
      emailVerified: user.emailVerified,
      passwordHash,
    };
  }
}
