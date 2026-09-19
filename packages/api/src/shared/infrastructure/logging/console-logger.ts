import type { ILogger, LogMeta } from "../../application/interfaces/i-logger";

export class ConsoleLogger implements ILogger {
  info(message: string, meta?: LogMeta): void {
    console.log(message, meta);
  }

  error(message: string, error?: Error, meta?: LogMeta): void {
    console.error(message, error, meta);
  }

  debug(message: string, meta?: LogMeta): void {
    console.debug(message, meta);
  }
}
