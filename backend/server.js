require("dotenv").config();
const express = require("express");

const app = express();

// ── Body parser (must come before security middleware) ────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Security middleware (helmet, cors, sanitize, rate limits) ─
const { applySecurityMiddleware } = require("./middleware/securityMiddleware");
applySecurityMiddleware(app);

// ── Database ──────────────────────────────────────────────────
const ConnectDB = require("./config/db");
ConnectDB();

// ── Verify SMTP on startup ────────────────────────────────────
const { verifySmtp } = require("./utils/emailService");
verifySmtp();

const { protect } = require("./middleware/authmiddleware");

app.get("/", (req, res) => res.send("DevSpace API running"));

// ── Auth ──────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});

// ── Workspaces (includes /dashboard) ─────────────────────────
const workspaceRoutes = require("./routes/workspaceRoutes");
app.use("/api/workspaces", workspaceRoutes);

// ── Projects ──────────────────────────────────────────────────
const projectRoutes = require("./routes/projectRoutes");
app.use("/api/projects", projectRoutes);

// ── Boards ────────────────────────────────────────────────────
const boardRoutes = require("./routes/boardRoutes");
app.use("/api/boards", boardRoutes);

// ── Tasks (includes /status) ──────────────────────────────────
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

// ── Activity feed ─────────────────────────────────────────────
const activityRoutes = require("./routes/activityRoutes");
app.use("/api/activities", activityRoutes);

// ── Channels + Messages ───────────────────────────────────────
const channelRoutes = require("./routes/channelRoutes");
app.use("/api/channels", channelRoutes);

// ── Direct Messages ───────────────────────────────────────────
const dmRoutes = require("./routes/dmRoutes");
app.use("/api/dm", dmRoutes);

// ── Notifications ─────────────────────────────────────────────
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});