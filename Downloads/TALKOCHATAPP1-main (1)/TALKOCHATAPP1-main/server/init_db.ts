import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Set it (for example: postgres://user:pass@host:5432/db) and try again.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const sqlPath = path.resolve(import.meta.dirname, '..', 'scripts', 'create_tables.sql');
    const sql = await fs.promises.readFile(sqlPath, 'utf-8');
    console.log(`Running SQL from ${sqlPath}...`);
    await pool.query(sql);
    console.log('Database initialized. Tables created if they did not already exist.');
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
