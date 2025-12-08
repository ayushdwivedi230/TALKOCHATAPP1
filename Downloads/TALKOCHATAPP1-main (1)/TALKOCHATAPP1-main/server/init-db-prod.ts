// Initialize database tables in production (Render)
import { Pool } from 'pg';

async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('DATABASE_URL not set, skipping database initialization');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('Initializing database tables...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ users table created');

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        "senderId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "recipientId" INTEGER REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ messages table created');

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
