import { user as userTable } from "../../../../db/schema/auth";
import type { UserId } from "../../../../shared/kernel/types/ids";
import { EmailVO } from "../../../../shared/kernel/values/email-vo";
import { UserEntity } from "../../domain/entities/user-entity";

export class UserMapper {
  static toDomain(row: typeof userTable.$inferSelect): UserEntity {
    // SAFETY: rows come from our own schema; branded ids restore without
    // revalidation.
    return UserEntity.restore(
      row.id as UserId,
      row.name,
      EmailVO.restore(row.email),
      row.emailVerified,
      row.image,
      row.createdAt,
      row.updatedAt,
    );
  }
}
