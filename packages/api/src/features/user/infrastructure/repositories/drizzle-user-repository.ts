import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import type {
  IUserRepository,
  NewUser,
} from "~/features/user/application/ports/i-user-repository";
import type { UserEntity } from "~/features/user/domain/entities/user-entity";
import { UserMapper } from "~/features/user/infrastructure/mappers/user-mapper";
import { DATABASE, type Database } from "~/shared/infrastructure/db/database";
import { user } from "~/shared/infrastructure/db/schema/auth";
import { activeDb } from "~/shared/infrastructure/db/tx-storage";
import type { UserId } from "~/shared/kernel/types/ids";
import type { EmailVO } from "~/shared/kernel/values/email-vo";

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private get dbOrTx(): Database {
    return activeDb(this.db);
  }

  async findById(userId: UserId): Promise<UserEntity | null> {
    const rows = await this.dbOrTx
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }

  async findByEmail(email: EmailVO): Promise<UserEntity | null> {
    const rows = await this.dbOrTx
      .select()
      .from(user)
      .where(eq(user.email, email.value))
      .limit(1);

    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }

  async emailExists(email: EmailVO): Promise<boolean> {
    const rows = await this.dbOrTx
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email.value))
      .limit(1);

    return rows.length > 0;
  }

  async create(input: NewUser): Promise<UserEntity> {
    const rows = await this.dbOrTx
      .insert(user)
      .values({
        id: input.id,
        name: input.name,
        email: input.email.value,
        emailVerified: false,
        image: null,
        createdAt: input.now,
        updatedAt: input.now,
      })
      .returning();

    return UserMapper.toDomain(rows[0]);
  }
}
