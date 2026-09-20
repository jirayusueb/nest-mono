import { AsyncLocalStorage } from "node:async_hooks";
import type { Database, Tx } from "./database";

export const txStorage = new AsyncLocalStorage<Tx>();

export function activeDb(db: Database): Database {
  // SAFETY: a transaction handle exposes the same query surface as the pool
  // handle; only connection-level members differ, and repositories never touch
  // those.
  return (txStorage.getStore() as Database | undefined) ?? db;
}
