import { user as userTable } from "../../../../db/schema/auth";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { Email } from "../../../../shared/kernel/values/email";
import { User } from "../../domain/entities/user";

export class UserMapper {
  /** Persistence rows are a trusted source — restore only. */
  static toDomain(row: typeof userTable.$inferSelect): User {
    // SAFETY: rows come from our own schema; branded ids restore without
    // revalidation.
    return User.restore({
      id: row.id as UserId,
      name: row.name,
      email: Email.restore(row.email),
      emailVerified: row.emailVerified,
      image: row.image,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
