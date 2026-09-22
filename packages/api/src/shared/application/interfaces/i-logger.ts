export type LogMeta = Record<string, string | number | boolean | null>;

export abstract class ILogger {
  abstract info(message: string, meta?: LogMeta): void;
  abstract error(message: string, error?: Error, meta?: LogMeta): void;
  abstract debug(message: string, meta?: LogMeta): void;
}
