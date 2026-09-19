export interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  /** False for a mismatch AND for an unparseable stored value; never throws. */
  verify(plain: string, stored: string): Promise<boolean>;
}
