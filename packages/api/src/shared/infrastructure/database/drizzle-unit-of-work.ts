import { Inject, Injectable } from "@nestjs/common";
import type { IUnitOfWork } from "../../application/interfaces/i-unit-of-work";
import { DATABASE, type Database } from "./database";
import { txStorage } from "./tx-storage";

@Injectable()
export class DrizzleUnitOfWork implements IUnitOfWork {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) => txStorage.run(tx, work));
  }
}
