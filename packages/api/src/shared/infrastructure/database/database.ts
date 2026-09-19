import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";

/** Bun's built-in Rust Postgres client — no `pg` / postgres.js dependency. */
const client = new SQL(process.env.DATABASE_URL ?? "");

export const db = drizzle(client);

export type Database = typeof db;

/**
 * A transaction handle — same query surface as `Database`, named at its owner.
 */
export type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
