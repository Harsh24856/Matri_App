// back/middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
  try {
    const header = req.headers["authorization"] || "";
    const [scheme, token] = header.split(" ");

    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
      return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not set in environment");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) return res.status(401).json({ error: "Invalid or expired token" });
      
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("AUTH error:", err);
    return res.status(500).json({ error: "Server error during authentication" });
  }
}


const requireAuth = authenticateToken;

module.exports = { authenticateToken, requireAuth };