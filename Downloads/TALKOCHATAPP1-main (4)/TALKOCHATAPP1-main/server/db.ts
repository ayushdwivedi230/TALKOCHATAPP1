// server/db.ts
// Database connection setup for Neon / Render using Drizzle ORM (ESM compatible)

import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

// Safety check
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Create PostgreSQL pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false } // Render + Neon
    : undefined, // local dev
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Graceful shutdown (important for Render)
process.on("SIGINT", async () => {
  console.log("Shutting down database pool...");
  await pool.end();
  process.exit(0);
});
