/**
 * scripts/run_sql.cjs
 * Safely creates "users" and "messages" tables in your PostgreSQL database if they don't exist.
 * Works both locally and inside Render.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ override: true }); // Load .env if available

// SQL file (can be created manually below)
const sqlFile = path.join(__dirname, 'create_tables.sql');

async function main() {
  const url = (process.env.DATABASE_URL || '').trim();
  if (!url) {
    console.error('❌ DATABASE_URL not found. Add it to your .env file or Render environment variables.');
    process.exit(2);
  }

  console.log('📡 DATABASE_URL length:', url.length);
  console.log('🔒 Preview:', url.substring(0, 60) + (url.length > 60 ? '...' : ''));

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }, // required for Render
  });

  try {
    // Debug connection details
    try {
      const parsed = new URL(url);
      const pw = parsed.password;
      const masked = pw
        ? pw[0] + '*'.repeat(Math.max(0, pw.length - 2)) + pw.slice(-1)
        : '<empty>';
      console.log('🌐 Host:', parsed.hostname);
      console.log('👤 User:', parsed.username);
      console.log('🔑 Password length:', pw ? pw.length : 0, '| Masked:', masked);
    } catch (e) {
      console.warn('⚠️ Failed to parse DATABASE_URL with URL():', e.message);
    }

    // Connect to PostgreSQL
    await client.connect();
    console.log('✅ Connected to PostgreSQL.');

    // Check if users table exists
    const res = await client.query("SELECT to_regclass('public.users') AS exists");
    const exists = res.rows[0] && res.rows[0].exists;

    if (!exists) {
      console.log('🧱 Table "public.users" not found. Applying SQL from', sqlFile);

      if (!fs.existsSync(sqlFile)) {
        console.error('❌ SQL file missing:', sqlFile);
        console.log('\nCreate it with the contents below:\n');
        console.log(getDefaultSQL());
        process.exit(1);
      }

      const sql = fs.readFileSync(sqlFile, 'utf8');
      await client.query(sql);
      console.log('✅ SQL executed successfully. Tables are now created.');
    } else {
      console.log('✅ Table "public.users" already exists. No changes needed.');
    }
  } catch (err) {
    console.error('❌ Database operation failed:');
    console.error(err.stack || err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
    console.log('🔚 Connection closed.');
  }
}

function getDefaultSQL() {
  return `
-- create_tables.sql default content --

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER NOT NULL REFERENCES public.users(id),
    recipient_id INTEGER REFERENCES public.users(id),
    text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
`;
}

main();
