require('dotenv').config();
const { Client } = require('pg');
(async () => {
  try {
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    const c = new Client({ connectionString: process.env.DATABASE_URL });
    await c.connect();
    console.log('Connected to DB');
    const r = await c.query("SELECT to_regclass('public.users') AS reg");
    console.log('to_regclass:', r.rows);
    await c.end();
    console.log('Done');
  } catch (e) {
    console.error('ERROR:', e.stack || e.message);
    process.exit(1);
  }
})();
