// back/express/dashboard.js
const express = require('express');
const db = require('../db.js'); // must export a query() connected to Postgres

const router = express.Router();

// GET /api/dashboard/last20
router.get('/last20', async (req, res) => {
  try {
    const sql = `
      SELECT *
      FROM public.maternal_health_diff
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const { rows } = await db.query(sql, [20]);

    return res.json({ data: rows, count: rows.length });
  } catch (err) {
    console.error('dashboard.last20 error:', err.message || err);
    return res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;