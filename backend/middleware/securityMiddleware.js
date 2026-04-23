const helmet      = require("helmet");
const cors        = require("cors");
const rateLimit   = require("express-rate-limit");
const morgan      = require("morgan");

/* ── CORS ────────────────────────────────────────────────────── */
const corsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/* ── Safe NoSQL injection sanitizer ─────────────────────────── */
// express-mongo-sanitize v2 tries to write req.query which is a read-only
// getter in Node 18+. We implement the same protection manually to avoid
// the TypeError crash.
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

function mongoSanitizeMiddleware(req, _res, next) {
  // Sanitize body and params (safe to mutate)
  if (req.body)   sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  // Do NOT touch req.query — it is a read-only getter in Node 18+
  next();
}

/* ── Safe XSS sanitizer ──────────────────────────────────────── */
// xss-clean is deprecated and may have the same req.query mutation issue.
// We implement a lightweight string-level strip instead.
const XSS_PATTERN = /<[^>]*>|javascript:/gi;

function stripXss(value) {
  if (typeof value === "string") return value.replace(XSS_PATTERN, "");
  if (Array.isArray(value))     return value.map(stripXss);
  if (value && typeof value === "object") {
    for (const k of Object.keys(value)) value[k] = stripXss(value[k]);
  }
  return value;
}

function xssMiddleware(req, _res, next) {
  // Only sanitize body/params — never mutate req.query
  if (req.body)   req.body   = stripXss(req.body);
  if (req.params) req.params = stripXss(req.params);
  next();
}

/* ── Rate limiters ───────────────────────────────────────────── */

// Auth-specific: 10 requests per 15 minutes per IP (production only)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
  // Skip in development & test so repeated testing doesn't trigger 429
  skip: () => process.env.NODE_ENV !== "production",
});

// General API: 200 requests per 15 minutes per IP (production only)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests. Please slow down.",
  },
  skip: () => process.env.NODE_ENV !== "production",
});

// Invite-specific: lenient — invites are one-time actions
const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many invite requests. Please try again later.",
  },
  skip: () => process.env.NODE_ENV !== "production",
});

/* ── Register all security middleware on the app ─────────────── */
function applySecurityMiddleware(app) {
  // 1. Secure HTTP headers
  //    Disable CSP in development so Vite's hot-reload inline scripts aren't blocked.
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production",
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS
  app.use(cors(corsOptions));

  // 3. NoSQL injection prevention (custom — avoids req.query mutation crash)
  app.use(mongoSanitizeMiddleware);

  // 4. XSS sanitization (custom — avoids req.query mutation crash)
  app.use(xssMiddleware);

  // 5. General API rate limit
  app.use("/api", generalLimiter);

  // 6. Request logger (development only)
  if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  }
}

module.exports = {
  applySecurityMiddleware,
  authLimiter,
  inviteLimiter,
};
