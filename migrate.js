const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const path = require('path');

(async () => {
  try {
    const connectionString = process.env.DATABASE_WRITE_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ No DATABASE_URL or DATABASE_WRITE_URL found');
      process.exit(1);
    }

    console.log('🔄 Running database migrations...');
    console.log('📁 Migrations folder:', path.join(process.cwd(), 'migrations'));
    
    const pool = new Pool({ connectionString });
    const db = drizzle(pool);
    
    const migrationPath = path.join(process.cwd(), 'migrations');
    await migrate(db, { migrationsFolder: migrationPath });
    
    console.log('✅ Migrations completed successfully');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
