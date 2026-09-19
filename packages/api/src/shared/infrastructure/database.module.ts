import { Global, Module } from "@nestjs/common";
import { DATABASE, DATE_PROVIDER, ID_GENERATOR, LOGGER } from "../tokens";
import { db } from "./database/database";
import { RealDateProvider } from "./date/real-date-provider";
import { UuidV7Generator } from "./ids/uuid-v7-generator";
import { ConsoleLogger } from "./logging/console-logger";

@Global()
@Module({
  providers: [
    { provide: DATABASE, useValue: db },
    { provide: DATE_PROVIDER, useClass: RealDateProvider },
    { provide: ID_GENERATOR, useClass: UuidV7Generator },
    { provide: LOGGER, useClass: ConsoleLogger },
  ],
  exports: [DATABASE, DATE_PROVIDER, ID_GENERATOR, LOGGER],
})
export class DatabaseModule {}
