import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { user } from "../../../../db/schema/auth";
import type { UserId } from "../../../../shared/kernel/types/ids";
import type { Database } from "../../../../shared/infrastructure/database/database";
import { DATABASE } from "../../../../shared/tokens";
import type { User } from "../../domain/entities/user";
import type { IUserRepository } from "../../application/ports/i-user-repository";
import { UserMapper } from "../mappers/user-mapper";

@Injectable()
export class DrizzleUserRepository implements IUserRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findById(userId: UserId): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return rows[0] ? UserMapper.toDomain(rows[0]) : null;
  }
}
