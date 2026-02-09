require('dotenv').config({ override: true });
const { Client } = require('pg');
(async () => {
  try {
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL.length);
    console.log('DATABASE_URL first 60 chars:', process.env.DATABASE_URL.slice(0,60));
    console.log('DATABASE_URL hex prefix:', Buffer.from(process.env.DATABASE_URL).toString('hex').slice(0,120));
    try {
      const u = new URL(process.env.DATABASE_URL);
      console.log('Parsed URL username:', u.username);
      console.log('Parsed URL password type:', typeof u.password, 'length:', u.password.length);
      // show hex of first bytes in case of hidden chars
      const hex = Buffer.from(u.password).toString('hex').slice(0, 80);
      console.log('Parsed password hex prefix:', hex);
    } catch (e) {
      console.log('Failed parsing DATABASE_URL with URL:', e.message);
    }
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
