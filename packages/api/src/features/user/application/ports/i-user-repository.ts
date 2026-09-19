import type { UserId } from "../../../../shared/kernel/types/ids";
import type { User } from "../../domain/entities/user";

/**
 * `user` reads the same `user` table auth writes, through its own port —
 * anti-corruption: the feature never imports auth.
 */
export interface IUserRepository {
  findById(userId: UserId): Promise<User | null>;
}
