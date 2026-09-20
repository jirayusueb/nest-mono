export const PASSWORD_HASHER = "PASSWORD_HASHER";

export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
}
