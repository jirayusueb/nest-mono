import type { IDateProvider } from "~/shared/application/interfaces/i-date-provider";

export class RealDateProvider implements IDateProvider {
  now(): Date {
    return new Date();
  }

  addSeconds(seconds: number, from = new Date()): Date {
    return new Date(from.getTime() + seconds * 1000);
  }

  addMinutes(minutes: number, from = new Date()): Date {
    return new Date(from.getTime() + minutes * 60000);
  }
}
