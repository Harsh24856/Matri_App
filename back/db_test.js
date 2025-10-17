// back/db_debug.js
const db = require('./express/db'); // your real db
(async () => {
  try {
    console.log('--- process.env PG keys ---');
    console.log('PGDATABASE:', process.env.PGDATABASE);
    console.log('PG_DATABASE:', process.env.PG_DATABASE);
    console.log('PGUSER:', process.env.PGUSER);
    console.log('PG_USER:', process.env.PG_USER);
    console.log('PGHOST:', process.env.PGHOST);
    console.log('PG_HOST:', process.env.PG_HOST);
    console.log('PGPASSWORD:', Boolean(process.env.PGPASSWORD) ? '[SET]' : '[EMPTY]');
    console.log('PG_PASSWORD:', Boolean(process.env.PG_PASSWORD) ? '[SET]' : '[EMPTY]');
    console.log('--- now db info ---');

    const r1 = await db.query('SELECT current_database() AS db');
    const r2 = await db.query('SELECT COUNT(*)::int AS count FROM public.maternal_health_diff');
    const r3 = await db.query('SELECT * FROM public.maternal_health_diff ORDER BY created_at DESC LIMIT 5');

    console.log('connected database:', r1.rows[0].db);
    console.log('row count:', r2.rows[0].count);
    console.log('latest rows length:', r3.rows.length);
    console.log('latest rows sample id(s):', r3.rows.map(r => r.id));
    process.exit(0);
  } catch (err) {
    console.error('db debug error:', err.message || err);
    process.exit(1);
  }
})();