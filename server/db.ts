
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

let pool, db;
try {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL must be set. Did you forget to provision a database?");
    process.exit(1);
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // required by Render
    },
  });
  db = drizzle(pool, { schema });
} catch (err) {
  console.error("Failed to initialize database:", err);
  process.exit(1);
}

export { pool, db };
