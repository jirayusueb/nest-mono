import { UserEntity } from "~/features/user/domain/entities/user-entity";
import { user as userTable } from "~/shared/infrastructure/db/schema/auth";
import type { UserId } from "~/shared/kernel/types/ids";
import { EmailVO } from "~/shared/kernel/values/email-vo";

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
