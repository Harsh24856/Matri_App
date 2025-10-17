// back/routes/login.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db"); 
require("dotenv").config();

module.exports = async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

  
    const normalizedEmail = String(email).trim().toLowerCase();

    
    const q = `
      SELECT id, email, password_hash, role, username, govt_id
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
    `;

    const { rows } = await db.query(q, [normalizedEmail]);
    const user = rows[0];

    
    if (!user) {
      // Optionally: await new Promise(r => setTimeout(r, 500)); // small delay to slow brute force
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok) {
      // Optionally: await new Promise(r => setTimeout(r, 500)); // add delay to slow brute force
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Build token payload using DB values (role is source of truth)
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not set in environment");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const tokenPayload = { 
      id: Number(user.id), 
      email: user.email, 
      role: user.role || "user",
      username: user.username   // add this
    };

    const token = jwt.sign(tokenPayload, secret, { expiresIn: "7d" });

  
    return res.json({
      token,
      user: tokenPayload,
    });
  } catch (err) {
    console.error("LOGIN error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
};