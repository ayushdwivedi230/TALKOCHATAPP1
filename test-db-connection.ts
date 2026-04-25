import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ override: true });

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");
    const res = await client.query('SELECT version()');
    console.log("Server Version:", res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error("❌ Connection error:", err);
    process.exit(1);
  }
}

testConnection();
