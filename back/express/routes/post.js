// back/routes/post_delivery.js
const express = require("express");
const db = require("../db");

const router = express.Router();

const createTableSql = `
CREATE TABLE IF NOT EXISTS post_delivery (
  id SERIAL PRIMARY KEY,
  mother_name VARCHAR(255),
  delivery_date DATE NOT NULL,
  complications TEXT,
  child_weight_kg NUMERIC(6,3) NOT NULL CHECK (child_weight_kg > 0),
  child_diseases TEXT,
  notes TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  external_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

(async function ensureTable() {
  try {
    await db.query(createTableSql);
    console.log("Ensured post_delivery table exists");
  } catch (err) {
    console.error("Error ensuring post_delivery table:", err);
  }
})();

function normalizeString(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function parseFloatOrNull(v) {
  const f = parseFloat(v);
  return Number.isNaN(f) ? null : f;
}
function parseDateOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
function normalizeListToString(v) {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    return v.join(",");
  }
  const s = String(v).trim();
  return s === "" ? null : s;
}

// POST /post-delivery
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    const mother_name = normalizeString(body.mother_name);
    const delivery_date = parseDateOrNull(body.delivery_date);
    const complications = normalizeString(body.complications);
    const child_weight_kg = parseFloatOrNull(body.child_weight_kg ?? body.child_weight);
    const child_diseases = normalizeListToString(body.child_diseases);
    const notes = normalizeString(body.notes);
    const submitted_at = body.submitted_at ? new Date(body.submitted_at) : new Date();
    const external_id = normalizeString(body.external_id);

    if (!delivery_date) {
      return res.status(400).json({ error: "delivery_date is required" });
    }
    if (child_weight_kg === null || Number(child_weight_kg) <= 0) {
      return res.status(400).json({ error: "child_weight_kg must be positive" });
    }

    const insertSql = `
      INSERT INTO post_delivery
        (mother_name, delivery_date, complications, child_weight_kg, child_diseases, notes, submitted_at, external_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
    `;

    const values = [
      mother_name,
      delivery_date,
      complications,
      child_weight_kg,
      child_diseases,
      notes,
      submitted_at,
      external_id,
    ];

    const { rows } = await db.query(insertSql, values);
    return res.status(201).json({ ok: true, record: rows[0] });
  } catch (err) {
    console.error("post_delivery POST error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

// GET /post-delivery/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { rows } = await db.query("SELECT * FROM post_delivery WHERE id = $1", [id]);
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    return res.json({ ok: true, record: rows[0] });
  } catch (err) {
    console.error("post_delivery GET error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});
// GET /post-delivery
router.get("/", async (req, res) => {
  try {
    // pagination params
    const limitQuery = parseInt(req.query.limit, 10);
    const offsetQuery = parseInt(req.query.offset, 10);
    const pageQuery = parseInt(req.query.page, 10);
    const pageSizeQuery = parseInt(req.query.pageSize, 10);

    let limit = Number.isFinite(limitQuery) ? limitQuery : Number.isFinite(pageSizeQuery) ? pageSizeQuery : 100;
    let offset = Number.isFinite(offsetQuery) ? offsetQuery : Number.isFinite(pageQuery) && Number.isFinite(pageSizeQuery)
      ? (pageQuery - 1) * pageSizeQuery
      : 0;

    // sanitize / enforce caps
    if (isNaN(limit) || limit <= 0) limit = 100;
    if (limit > 1000) limit = 1000;
    if (isNaN(offset) || offset < 0) offset = 0;

    // filters
    const search = req.query.search ? String(req.query.search).trim() : null;
    const since = req.query.since ? String(req.query.since).trim() : null; // inclusive
    const before = req.query.before ? String(req.query.before).trim() : null; // inclusive

    // build WHERE clauses safely with params
    const whereClauses = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      whereClauses.push(`(mother_name ILIKE $${params.length - 2} OR notes ILIKE $${params.length - 1} OR external_id ILIKE $${params.length})`);
      // note: we pushed 3 params; parameter numbers set accordingly
    }

    if (since) {
      // expect YYYY-MM-DD or full ISO
      const d = new Date(since);
      if (!Number.isNaN(d.getTime())) {
        params.push(d.toISOString());
        whereClauses.push(`created_at >= $${params.length}`);
      }
    }

    if (before) {
      const d = new Date(before);
      if (!Number.isNaN(d.getTime())) {
        // add one day to make "before" inclusive of the date provided if user passed date-only
        params.push(d.toISOString());
        whereClauses.push(`created_at <= $${params.length}`);
      }
    }

    // base SQL - using window function to get total count
    let sql = `
      SELECT
        *,
        COUNT(*) OVER() AS total_count
      FROM post_delivery
    `;

    if (whereClauses.length) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    sql += " ORDER BY created_at DESC";
    // attach limit and offset params
    params.push(limit);
    params.push(offset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await db.query(sql, params);

    if (!rows || rows.length === 0) {
      return res.json({ ok: true, data: [], total: 0, limit, offset });
    }

    const total = parseInt(rows[0].total_count, 10) || 0;

    // map results: parse child_diseases into array for frontend convenience
    const data = rows.map((r) => {
      const row = { ...r };
      if (row.child_diseases && typeof row.child_diseases === "string") {
        // split by comma, trim, remove empty values
        row.child_diseases_array = row.child_diseases
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length);
      } else {
        row.child_diseases_array = [];
      }
      // ensure created_at and submitted_at are ISO strings
      if (row.created_at) row.created_at = new Date(row.created_at).toISOString();
      if (row.submitted_at) row.submitted_at = new Date(row.submitted_at).toISOString();
      return row;
    });

    return res.json({ ok: true, data, total, limit, offset });
  } catch (err) {
    console.error("post_delivery LIST error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

module.exports = router;