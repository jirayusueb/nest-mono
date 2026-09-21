import { migrate } from "drizzle-orm/bun-sql/migrator";

import { createDatabase } from "~/shared/infrastructure/db/database";

export async function runMigrations(databaseUrl: string): Promise<void> {
  await migrate(createDatabase(databaseUrl), {
    migrationsFolder: `${import.meta.dir}/migrations`,
  });
}
