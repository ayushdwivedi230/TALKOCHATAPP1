// Database connection setup for Render + Drizzle ORM + PostgreSQL (ESM compatible)

import dotenv from 'dotenv';
dotenv.config({ override: true });
import pkg from 'pg';
const { Pool } = pkg; // CommonJS interop for 'pg'

import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Check if the environment variable is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

console.log(`[Database] Connecting to: ${process.env.DATABASE_URL.split('@')[1] || 'URL (hidden credentials)'}`);

// Create PostgreSQL connection pool
// Prioritize DATABASE_URL if available, otherwise use individual components
export const pool = new Pool(
  process.env.DATABASE_URL
    ? { 
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false
      }
    : {
        user: String(process.env.DB_USER || 'postgres'),
        password: String(process.env.DB_PASSWORD || '1234'),
        host: String(process.env.DB_HOST || 'localhost'),
        port: Number(process.env.DB_PORT || 5432),
        database: String(process.env.DB_NAME || 'testdb'),
        ssl: false,
      }
);

// Initialize Drizzle ORM with your schema
export const db = drizzle(pool, { schema });

// Optional: graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

