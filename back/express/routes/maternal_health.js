// back/routes/maternal_diff.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("../db");
const { predictRecord } = require("./predict"); // path: back/predict.js

const router = express.Router();

const createTableSql = `
CREATE TABLE IF NOT EXISTS maternal_health_diff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  age INT,
  past_pregnancy_count INT DEFAULT 0,
  blood_group_mother VARCHAR(3),
  blood_group_father VARCHAR(3),
  medical_bg_mother TEXT,
  medical_bg_father TEXT,
  years_since_last_pregnancy INT CHECK (years_since_last_pregnancy >= 0),
  delivery_type VARCHAR(20),
  haemoglobin NUMERIC(4,1),
  external_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

(async function ensureTable() {
  try {
    await db.query(createTableSql);
    // console.log("Ensured maternal_health_diff exists");
  } catch (err) {
    console.error("Error ensuring maternal_health_diff table:", err);
  }
})();

// Ensure predictions directory exists
const PRED_DIR = path.join(__dirname, "..", "predictions");
try {
  if (!fs.existsSync(PRED_DIR)) {
    fs.mkdirSync(PRED_DIR, { recursive: true });
  }
} catch (err) {
  console.error("Could not ensure predictions directory:", err);
}

// ---------------- Helpers ----------------
function normalizeString(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function parseIntOrNull(v) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}
function parseFloatOrNull(v) {
  const f = parseFloat(v);
  return Number.isNaN(f) ? null : f;
}

/**
 * Write prediction JSON to disk under back/predictions/<id>.json
 * Returns the absolute path to the file on success.
 */
async function writePredictionToFile(id, predictionObj) {
  if (!id) {
    throw new Error("Missing id when attempting to write prediction file");
  }
  const filename = `prediction_${id}.json`;
  const filepath = path.join(PRED_DIR, filename);
  const data = JSON.stringify(predictionObj, null, 2);
  await fs.promises.writeFile(filepath, data, "utf8");
  return filepath;
}

// ---------------- Routes ----------------

// POST /maternal-health
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};

    const name = normalizeString(body.name);
    const age = parseIntOrNull(body.age);
    const past_pregnancy_count = parseIntOrNull(
      body.past_pregnancy_count ?? body.pastPregnancyCount
    );
    const blood_group_mother = normalizeString(
      body.blood_group_mother ?? body.bloodGroupMother
    );
    const blood_group_father = normalizeString(
      body.blood_group_father ?? body.bloodGroupFather
    );
    const medical_bg_mother = normalizeString(
      body.medical_bg_mother ?? body.medicalBgMother
    );
    const medical_bg_father = normalizeString(
      body.medical_bg_father ?? body.medicalBgFather
    );
    const years_since_last_pregnancy = parseIntOrNull(
      body.years_since_last_pregnancy ?? body.yearsSinceLastPregnancy
    );
    const delivery_type = normalizeString(body.delivery_type ?? body.deliveryType);
    const haemoglobin = parseFloatOrNull(body.haemoglobin);
    const external_id = normalizeString(body.external_id ?? body.externalId);

    if (!name && !external_id) {
      return res
        .status(400)
        .json({ error: "At least 'name' or 'external_id' is required" });
    }

    const insertSql = `
      INSERT INTO maternal_health_diff
        (name, age, past_pregnancy_count, blood_group_mother, blood_group_father,
         medical_bg_mother, medical_bg_father, years_since_last_pregnancy,
         delivery_type, haemoglobin, external_id)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id, created_at;
    `;

    const values = [
      name,
      age,
      past_pregnancy_count,
      blood_group_mother,
      blood_group_father,
      medical_bg_mother,
      medical_bg_father,
      years_since_last_pregnancy,
      delivery_type,
      haemoglobin,
      external_id,
    ];

    // Insert the row
    const { rows } = await db.query(insertSql, values);
    const insertedId = rows[0].id;
    const createdAt = rows[0].created_at;

    // Fetch the full inserted row (so we have all columns as stored)
    const { rows: fetched } = await db.query(
      "SELECT * FROM maternal_health_diff WHERE id = $1 LIMIT 1",
      [insertedId]
    );
    const insertedRow = fetched[0];

    // Build JSON payload matching preprocess.py expectations.
    const jsonForPrediction = {
      id: insertedRow.id,
      name: insertedRow.name,
      age: insertedRow.age,
      past_pregnancy_count: insertedRow.past_pregnancy_count,
      blood_group_mother: insertedRow.blood_group_mother,
      blood_group_father: insertedRow.blood_group_father,
      medical_bg_mother: insertedRow.medical_bg_mother,
      medical_bg_father: insertedRow.medical_bg_father,
      years_since_last_pregnancy: insertedRow.years_since_last_pregnancy,
      delivery_type: insertedRow.delivery_type,
      haemoglobin: insertedRow.haemoglobin,
      external_id: insertedRow.external_id,
      created_at: insertedRow.created_at
    };

    // Await prediction and include it in the response. If prediction fails, still return insert success.
    let predictionResult = null;
    let predictionFile = null;
    try {
      predictionResult = await predictRecord(jsonForPrediction, { include_id: true, timeout: 30000 });

      // Save prediction JSON to disk
      try {
        const filepath = await writePredictionToFile(insertedId, predictionResult);
        console.log("Prediction file written to:", filepath);
        predictionFile = filepath;
      } catch (fileErr) {
        console.error("Failed to write prediction file:", fileErr);
        // don't throw; we still want to return the insert success
      }
    } catch (err) {
      console.error("Prediction failed for inserted row id=", insertedId, err.message || err);
    }

    // Build response payload
    const responsePayload = {
      ok: true,
      id: insertedId,
      created_at: createdAt,
      record: insertedRow,
      prediction: predictionResult, // null if unavailable
      prediction_file: predictionFile, // path to saved prediction JSON or null
    };
    console.log(responsePayload);
    return res.status(201).json(responsePayload);
  } catch (err) {
    console.error("maternal_diff POST error:", err);
    return res
      .status(500)
      .json({ error: "Server error", detail: err.message });
  }
});

// GET /maternal-health/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const { rows } = await db.query(
      "SELECT * FROM maternal_health_diff WHERE id = $1 LIMIT 1",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });

    return res.json({ ok: true, record: rows[0] });
  } catch (err) {
    console.error("maternal_diff GET error:", err);
    return res
      .status(500)
      .json({ error: "Server error", detail: err.message });
  }
});

module.exports = router;