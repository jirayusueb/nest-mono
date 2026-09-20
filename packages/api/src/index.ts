export { createApp } from "./bootstrap/create-app";

export { type Env, loadEnv } from "./shared/infrastructure/config/env";

export { runMigrations } from "./db/migrate";

export { ensureBucket } from "./features/media/infrastructure/stores/ensure-bucket";

export { Result, type Err, type Ok } from "./shared/kernel/types/result";

export { err, ok } from "./shared/kernel/types/result";

export type { SessionId, PostId, UserId } from "./shared/kernel/types/ids";

export type { SessionUser } from "./shared/kernel/types/session-user";

export { AppError } from "./shared/kernel/errors/app-error";
export { DomainError } from "./shared/kernel/errors/domain-error";

export { ConsoleLogger } from "./shared/infrastructure/logging/console-logger";

export { RealDateProvider } from "./shared/infrastructure/date/real-date-provider";

export { UuidV7Generator } from "./shared/infrastructure/ids/uuid-v7-generator";

export type { Database } from "./shared/infrastructure/database/database";

export type { IDateProvider } from "./shared/application/interfaces/i-date-provider";

export type { IIdGenerator } from "./shared/application/interfaces/i-id-generator";

export type { ILogger } from "./shared/application/interfaces/i-logger";
