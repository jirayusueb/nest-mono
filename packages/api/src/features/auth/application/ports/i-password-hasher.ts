export abstract class IPasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract verify(plain: string, stored: string): Promise<boolean>;
}
