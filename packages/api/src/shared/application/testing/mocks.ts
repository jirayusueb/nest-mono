import { createMock, type DeepMocked } from "@golevelup/ts-vitest";

import type { IDateProvider } from "~/shared/application/interfaces/i-date-provider";
import type { IIdGenerator } from "~/shared/application/interfaces/i-id-generator";
import type { IUnitOfWork } from "~/shared/application/interfaces/i-unit-of-work";

export function mockDateProvider(current: Date): DeepMocked<IDateProvider> {
  const addSeconds = (seconds: number, from?: Date): Date =>
    new Date((from ?? current).getTime() + seconds * 1000);

  return createMock<IDateProvider>({
    now: () => current,
    addSeconds,
    addMinutes: (minutes, from) => addSeconds(minutes * 60, from),
  });
}

export function mockIdGenerator(): DeepMocked<IIdGenerator> {
  let counter = 0;

  return createMock<IIdGenerator>({
    generate: () => {
      counter += 1;

      return `id-${counter}`;
    },
  });
}

export function mockUnitOfWork(): DeepMocked<IUnitOfWork> {
  const uow = createMock<IUnitOfWork>();

  uow.runInTransaction.mockImplementation((work) => work());

  return uow;
}
