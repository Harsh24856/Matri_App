const express = require("express");
const db = require("../db.js");
const router = express.Router();

// PATCH /dashboard/survey/:id → mark surveyed = true
router.patch("/survey/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      "UPDATE maternal_health_diff SET surveyed = TRUE WHERE id = $1",
      [id]
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error("Error updating surveyed:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;