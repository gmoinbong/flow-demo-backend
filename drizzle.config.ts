import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default {
  schema: './src/shared/core/infrastructure/database/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_WRITE_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
