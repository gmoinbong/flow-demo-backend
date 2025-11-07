import { Database, PostgresTransactionConfig } from './database.types';

export type RepositoryFactoryMap<TRepos> = (tx: any) => TRepos;

export class UnitOfWork {
  constructor(private readonly db: Database) {}

  async execute<T, TRepos>(
    createRepositories: RepositoryFactoryMap<TRepos>,
    work: (repos: TRepos) => Promise<T>,
    options?: PostgresTransactionConfig,
  ): Promise<T> {
    return this.db.transaction(async (tx) => {
      const repos = createRepositories(tx);
      return work(repos);
    }, options as any);
  }
}
