import { SQL } from "bun";
import { type BunSQLDatabase, drizzle } from "drizzle-orm/bun-sql";

export const DATABASE = "DATABASE";

export type Database = BunSQLDatabase;

export function createDatabase(url: string): Database {
  return drizzle(new SQL(url));
}

export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
