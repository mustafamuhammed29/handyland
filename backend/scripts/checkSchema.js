const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function check() {
  const client = new Client({ connectionString: process.env.DATABASE_URL.replace('?sslmode=require', '') });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'addresses'");
    console.log('Columns:', res.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
  } catch(e) { console.error('DB Error:', e.message); }
  finally { await client.end(); }
}
check();
