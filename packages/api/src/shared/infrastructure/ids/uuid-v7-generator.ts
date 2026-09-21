import { v7 } from "uuid";

import type { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";

export class UuidV7Generator implements IIdGenerator {
  generate(): string {
    return v7();
  }
}
