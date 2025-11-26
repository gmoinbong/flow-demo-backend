import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SHARED_DI_TOKENS } from '../constants/tokens';
import { DatabaseConfig, load } from './config/db.config';
import { Pool } from 'pg';
import * as schema from './schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { withReplicas } from 'drizzle-orm/pg-core';
import { UnitOfWork } from './unit-of-work';

export const DatabaseConfigProvider: Provider = {
  provide: SHARED_DI_TOKENS.DATABASE_CONFIG,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const databaseUrl =
      configService.get<string>('DATABASE_WRITE_URL') ||
      configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error(
        'Database URL is required. Please set DATABASE_URL or DATABASE_WRITE_URL environment variable.',
      );
    }

    return load.from.env({
      DATABASE_WRITE_URL: databaseUrl,
      DATABASE_READ_REPLICA_URLS: configService.get<string>(
        'DATABASE_READ_REPLICA_URLS',
      ),
    } as NodeJS.ProcessEnv);
  },
};

export const DatabaseClientProvider: Provider = {
  provide: SHARED_DI_TOKENS.DATABASE_CLIENT,
  inject: [SHARED_DI_TOKENS.DATABASE_CONFIG],
  useFactory(config: DatabaseConfig) {
    const cfg = {
      connectionString: config.DATABASE_WRITE_URL,
    };
    const primaryPool = new Pool(cfg);

    const primaryDb = drizzle(primaryPool, { schema });

    const replicas = config.DATABASE_READ_REPLICA_URLS.map((url) => {
      const pool = new Pool({ connectionString: url });

      return drizzle(pool, { schema });
    });

    const db =
      replicas.length > 0
        ? withReplicas(
            primaryDb,
            replicas as [typeof primaryDb, ...(typeof primaryDb)[]],
          )
        : primaryDb;
    return db;
  },
};

export const DatabaseProvider = [
  DatabaseConfigProvider,
  DatabaseClientProvider,
  {
    provide: SHARED_DI_TOKENS.UNIT_OF_WORK,
    inject: [SHARED_DI_TOKENS.DATABASE_CLIENT],
    useFactory: (db: any) => new UnitOfWork(db),
  },
];
