import type { account, user } from "../../../../db/schema/auth";
import type { AuthIdentity } from "../../application/ports/i-identity-repository";

export type UserRow = typeof user.$inferSelect;

export type AccountRow = typeof account.$inferSelect;

export class IdentityMapper {
  static toDomain(
    userRow: UserRow,
    accountRow: AccountRow | null,
  ): AuthIdentity {
    return {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      image: userRow.image,
      emailVerified: userRow.emailVerified,
      passwordHash: accountRow?.password ?? null,
    };
  }
}
