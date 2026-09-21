import { Global, Module } from "@nestjs/common";

import { DATE_PROVIDER } from "~/shared/application/interfaces/i-date-provider";
import { ID_GENERATOR } from "~/shared/application/interfaces/i-id-generator";
import { LOGGER } from "~/shared/application/interfaces/i-logger";
import { UNIT_OF_WORK } from "~/shared/application/interfaces/i-unit-of-work";

import { CONFIG, type Env } from "./config/env";
import { RealDateProvider } from "./date/real-date-provider";
import { createDatabase, DATABASE } from "./db/database";
import { DrizzleUnitOfWork } from "./db/drizzle-unit-of-work";
import { UuidV7Generator } from "./ids/uuid-v7-generator";
import { ConsoleLogger } from "./logging/console-logger";

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (env: Env) => createDatabase(env.DATABASE_URL),
      inject: [CONFIG],
    },
    { provide: DATE_PROVIDER, useClass: RealDateProvider },
    { provide: ID_GENERATOR, useClass: UuidV7Generator },
    { provide: LOGGER, useClass: ConsoleLogger },
    { provide: UNIT_OF_WORK, useClass: DrizzleUnitOfWork },
  ],
  exports: [DATABASE, DATE_PROVIDER, ID_GENERATOR, LOGGER, UNIT_OF_WORK],
})
export class DatabaseModule {}
