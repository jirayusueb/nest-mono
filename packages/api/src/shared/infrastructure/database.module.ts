import { Global, Module } from "@nestjs/common";

import { IDateProvider } from "~/shared/application/interfaces/i-date-provider";
import { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";
import { ILogger } from "~/shared/application/interfaces/i-logger";
import { IUnitOfWork } from "~/shared/application/interfaces/i-unit-of-work";

import { ConfigService } from "./config/config-service";
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
      useFactory: (config: ConfigService) =>
        createDatabase(config.env.DATABASE_URL),
      inject: [ConfigService],
    },
    { provide: IDateProvider, useClass: RealDateProvider },
    { provide: IIdGenerator, useClass: UuidV7Generator },
    { provide: ILogger, useClass: ConsoleLogger },
    { provide: IUnitOfWork, useClass: DrizzleUnitOfWork },
  ],
  exports: [DATABASE, IDateProvider, IIdGenerator, ILogger, IUnitOfWork],
})
export class DatabaseModule {}
