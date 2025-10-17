// back/db.js
const path = require('path');

// load .env from back/ directory (safe no-op if already loaded)
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Pool, types } = require('pg');

// Parse int8 (OID 20) and numeric/decimal (OID 1700) as JS numbers
types.setTypeParser(20, (val) => (val === null ? null : parseInt(val, 10)));
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

const pool = new Pool({
  host: process.env.PGHOST || process.env.PG_HOST || 'localhost',
  user: process.env.PGUSER || process.env.PG_USER || process.env.USER,
  database: process.env.PGDATABASE || process.env.PG_DATABASE || process.env.USER,
  password: process.env.PGPASSWORD || process.env.PG_PASSWORD || undefined,
  port: parseInt(process.env.PGPORT || process.env.PG_PORT || '5432', 10),
});

pool.on('connect', () => {
  console.log('PG pool connected to DB:', process.env.PGDATABASE || process.env.PG_DATABASE || '(unknown)');
});
pool.on('error', (err) => console.error('PG pool error:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};