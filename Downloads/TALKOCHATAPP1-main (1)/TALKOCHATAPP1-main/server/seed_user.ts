import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set. Set it and try again.');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // ensure the users table exists by attempting a simple query
    await pool.query(`SELECT 1 FROM users LIMIT 1`);
  } catch (err) {
    console.error('Could not query users table. Run `npm run init-db` first to create tables.');
    console.error(String(err));
    await pool.end();
    process.exit(1);
  }

  const username = process.env.SEED_USERNAME || 'testuser';
  const password = process.env.SEED_PASSWORD || 'password123';

  try {
    const res = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (res.rowCount > 0) {
      console.log(`User '${username}' already exists (id=${res.rows[0].id}).`);
    } else {
      const hashed = await bcrypt.hash(password, 10);
      const insert = await pool.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
        [username, hashed],
      );
      console.log(`Created user '${username}' with id=${insert.rows[0].id}. Password: ${password}`);
    }
  } catch (err) {
    console.error('Failed to seed user:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
