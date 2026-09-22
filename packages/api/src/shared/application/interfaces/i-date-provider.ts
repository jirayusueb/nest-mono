export abstract class IDateProvider {
  abstract now(): Date;
  abstract addSeconds(seconds: number, from?: Date): Date;
  abstract addMinutes(minutes: number, from?: Date): Date;
}
