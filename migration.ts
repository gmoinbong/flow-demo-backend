import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import pg from 'pg';
import { exit } from 'process';

import * as allSchema from './src/shared/core/infrastructure/database/schema';

dotenv.config();

(async () => {

  const connectionString =
    process.env.DATABASE_WRITE_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error(
      'Error: DATABASE_WRITE_URL or DATABASE_URL environment variable is required',
    );
    exit(1);
  }

  const pool = new pg.Pool({
    connectionString,
  });
  let db: NodePgDatabase<typeof allSchema> | null = null;
  db = drizzle(pool, {
    schema: {
      ...allSchema,
    },
  });

  // Look for migrations in the root migrations folder
  const migrationPath = path.join(process.cwd(), 'migrations');

  // Run the migrations
  await migrate(db, { migrationsFolder: migrationPath });

  // Insert default roles
  for (const role of ['Super Admin', 'Admin', 'User', 'Guest']) {
    const existingUserRole = await db
      ?.select({
        name: allSchema.user_role.name,
      })
      .from(allSchema.user_role)
      .where(eq(allSchema.user_role.name, role));
    if (!existingUserRole[0]) {
      await db?.insert(allSchema.user_role).values({ name: role });
    }
  }
  console.log('Migration complete');
  exit(0);
})();


