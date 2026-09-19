import { migrate } from "drizzle-orm/bun-sql/migrator";
import { db } from "../shared/infrastructure/database/database";

export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: `${import.meta.dir}/migrations` });
}
