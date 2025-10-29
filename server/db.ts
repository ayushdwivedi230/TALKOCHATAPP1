import { Pool } from 'pg'; // ✅ correct ESM import
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

let pool, db;

try {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL must be set. Did you forget to provision a database?");
    process.exit(1);
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // ✅ required for Render PostgreSQL
    },
  });

  db = drizzle(pool, { schema });
  console.log("✅ Database connected successfully");

} catch (err) {
  console.error("🚨 Failed to initialize database:", err);
  process.exit(1);
}

export { pool, db };
