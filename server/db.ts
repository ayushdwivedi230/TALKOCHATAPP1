// Database connection setup for Render + Drizzle ORM + PostgreSQL (ESM compatible)

import pkg from 'pg';
const { Pool } = pkg; // CommonJS interop for 'pg'

import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';

// Check if the environment variable is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required by Render
  },
});

// Initialize Drizzle ORM with your schema
export const db = drizzle(pool, { schema });

// Optional: graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

