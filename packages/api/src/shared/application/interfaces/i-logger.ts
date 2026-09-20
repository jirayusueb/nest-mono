export const LOGGER = "LOGGER";

export type LogMeta = Record<string, string | number | boolean | null>;

export interface ILogger {
  info(message: string, meta?: LogMeta): void;
  error(message: string, error?: Error, meta?: LogMeta): void;
  debug(message: string, meta?: LogMeta): void;
}
