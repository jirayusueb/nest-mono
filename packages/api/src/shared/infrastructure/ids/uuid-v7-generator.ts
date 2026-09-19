import { v7 } from "uuid";
import type { IIdGenerator } from "../../application/interfaces/i-id-generator";

export class UuidV7Generator implements IIdGenerator {
  generate(): string {
    return v7();
  }
}
