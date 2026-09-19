import type { IDateProvider } from "../interfaces/i-date-provider";
import type { IIdGenerator } from "../interfaces/i-id-generator";

export class MockDateProvider implements IDateProvider {
  constructor(private readonly current: Date) {}

  now(): Date {
    return this.current;
  }

  addSeconds(seconds: number, from?: Date): Date {
    return new Date((from ?? this.current).getTime() + seconds * 1000);
  }

  addMinutes(minutes: number, from?: Date): Date {
    return this.addSeconds(minutes * 60, from);
  }
}

export class MockIdGenerator implements IIdGenerator {
  private counter = 0;

  generate(): string {
    this.counter += 1;

    return `id-${this.counter}`;
  }
}
