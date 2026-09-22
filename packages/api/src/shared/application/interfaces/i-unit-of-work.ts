export abstract class IUnitOfWork {
  abstract runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}
