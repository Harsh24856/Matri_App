// back/routes/register.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db"); 

module.exports = async function register(req, res) {
  try {
    const { username, email, password, govt_id } = req.body || {};

    if (!username || !email || !password || !govt_id) {
      return res.status(400).json({ error: "username, email, password and govt_id are required" });
    }

    // normalize email and govt_id
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedGovtId = String(govt_id).trim();

    // check for existing email or govt_id
    const existsQ = `SELECT id FROM users WHERE LOWER(email) = $1 OR govt_id = $2 LIMIT 1`;
    const { rows: existRows } = await db.query(existsQ, [normalizedEmail, normalizedGovtId]);
    if (existRows.length > 0) {
      return res.status(409).json({ error: "Email or Government ID already registered" });
    }

    // hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // insert user
    const insertQ = `
      INSERT INTO users (username, email, password_hash, govt_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role;
    `;
    const { rows } = await db.query(insertQ, [username.trim(), normalizedEmail, password_hash, normalizedGovtId]);
    const user = rows[0];

    // sign token (same secret as login route)
    const secret = process.env.JWT_SECRET || "supersecretkey";
    const tokenPayload = { 
      id: Number(user.id), 
      email: user.email, 
      role: user.role || "user",
      username: user.username   // add this
    };
    const token = jwt.sign(tokenPayload, secret, { expiresIn: "7d" });

    return res.status(201).json({ token, user: tokenPayload });
  } catch (err) {
    console.error("REGISTER error:", err);
    if (err && err.code === "23505") { 
      return res.status(409).json({ error: "Email or Government ID already exists" });
    }
    res.status(500).json({ error: "Server error", detail: err.message });
  }
};