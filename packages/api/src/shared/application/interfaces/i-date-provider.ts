export const DATE_PROVIDER = "DATE_PROVIDER";

export interface IDateProvider {
  now(): Date;
  addSeconds(seconds: number, from?: Date): Date;
  addMinutes(minutes: number, from?: Date): Date;
}
