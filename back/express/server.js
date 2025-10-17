// server.js
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./db");

// ---- routes (must exist and export a router or handler) ----
const signup = require("./routes/register");               // function (req,res)=>...
const login = require("./routes/login");                   // function (req,res)=>...
const maternalHealth = require("./routes/maternal_health"); // express.Router()
const dashboard = require("./routes/dashboard");           // express.Router()
const survey = require("./routes/survey");                 // express.Router()
const postDeliveryRouter = require("./routes/post");       // express.Router()

// ---- auth middleware (must export requireAuth) ----
let requireAuth = (req, res, next) => next();
const DISABLE_AUTH = String(process.env.DISABLE_AUTH || "").trim() === "1";
try {
  const auth = require("./middleware/auth");
  if (!DISABLE_AUTH && auth && typeof auth.requireAuth === "function") {
    requireAuth = auth.requireAuth;
  } else if (!DISABLE_AUTH) {
    console.warn("⚠️ requireAuth not found; temporarily allowing all requests. Set DISABLE_AUTH=1 to silence this.");
  }
} catch (e) {
  if (!DISABLE_AUTH) {
    console.warn("⚠️ Failed to load middleware/auth. Temporarily allowing all requests. Set DISABLE_AUTH=1 while testing.");
  }
}

const app = express();

/* ---------------- CORS & body parsing ---------------- */
const corsOptions = {
  origin: "*", // tighten in prod
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// Manual preflight that works on Express 5 (no path-to-regexp "*")
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/* ---------------- Health check ---------------- */
app.get("/", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

/* ---------------- Static files (optional) ----------------
   If you generate and link prediction JSONs like:
   /predictions/prediction_<id>.json
--------------------------------------------------------- */
try {
  app.use(
    "/predictions",
    express.static(path.join(__dirname, "predictions"), { fallthrough: true, maxAge: "5m" })
  );
} catch (e) {
  console.warn("⚠️ predictions static mount skipped:", e.message);
}

/* ---------------- Public routes ---------------- */
app.post("/register", wrapRoute(signup));
app.post("/login", wrapRoute(login));

/* ---------------- Protected routes ----------------
   The RN app sends Bearer tokens; keep server consistent.
   You can set DISABLE_AUTH=1 in .env while testing.
--------------------------------------------------- */
const authChain = DISABLE_AUTH ? (req, _res, next) => next() : requireAuth;

app.use("/maternal-health", authChain, guardRouter(maternalHealth));
app.use("/post-delivery", authChain, guardRouter(postDeliveryRouter));
app.use("/dashboard", authChain, guardRouter(dashboard), guardRouter(survey));

/* ---------------- Not Found ---------------- */
app.use((req, res, _next) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

/* ---------------- Central Error Handler ---------------- */
app.use((err, _req, res, _next) => {
  console.error("💥 Unhandled error:", err && (err.stack || err));
  res.status(err.statusCode || 500).json({ error: "Server error" });
});

/* ---------------- Extra crash diagnostics ---------------- */
process.on("unhandledRejection", (reason) => {
  console.error("🔴 Unhandled Promise Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("🔴 Uncaught Exception:", err);
  // process.exit(1); // enable in prod if you prefer an immediate restart
});

/* ---------------- Start server after DB ok ---------------- */
const PORT = process.env.PORT || 3000;
db.query("SELECT 1")
  .then(() => {
    console.log("✅ Connected to PostgreSQL");
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`✅ Server running at http://0.0.0.0:${PORT}  (DISABLE_AUTH=${DISABLE_AUTH ? "1" : "0"})`)
    );
  })
  .catch((err) => {
    console.error("DB connection failed:", err);
    process.exit(1);
  });

/* ================= Helpers ================= */

// Allow route files to export either a handler function or a router.
function guardRouter(maybeRouter) {
  if (typeof maybeRouter === "function" && maybeRouter.name !== "router") {
    // It's a plain handler; wrap into an express.Router
    const r = express.Router();
    r.use(maybeRouter);
    return r;
  }
  if (maybeRouter && typeof maybeRouter === "function") return maybeRouter;
  const r = express.Router();
  r.use((_req, res) => res.status(500).json({ error: "Route not mounted properly" }));
  return r;
}

// Wrap single handler routes to catch async errors
function wrapRoute(handler) {
  if (typeof handler !== "function") {
    return (_req, res) => res.status(500).json({ error: "Route handler missing" });
    }
  return (req, res, next) => {
    try {
      const out = handler(req, res, next);
      if (out && typeof out.then === "function") out.catch(next);
    } catch (e) {
      next(e);
    }
  };
}