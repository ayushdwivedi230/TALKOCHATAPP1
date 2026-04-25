import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config({ override: true });

const passwords = ['', 'postgres', '1234', 'password', 'admin'];
const user = process.env.DB_USER || 'postgres';
const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 5432);
const database = process.env.DB_NAME || 'testdb';

async function crack() {
  for (const pwd of passwords) {
    console.log(`Trying password: "${pwd}"`);
    const client = new Client({
      user,
      password: pwd,
      host,
      port,
      database: 'postgres', // try default db first
      ssl: false
    });
    try {
      await client.connect();
      console.log(`Success! Password is: "${pwd}"`);
      await client.end();
      return;
    } catch (err: any) {
      console.log(`Failed: ${err.message}`);
    }
  }
}

crack();
