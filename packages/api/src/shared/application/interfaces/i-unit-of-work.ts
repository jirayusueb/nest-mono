export const UNIT_OF_WORK = "UNIT_OF_WORK";

export interface IUnitOfWork {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
