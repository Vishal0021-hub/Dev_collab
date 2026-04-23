require("dotenv").config();
const express = require("express");
const http    = require("http");
const { initSocket } = require("./socket");

const app        = express();
const httpServer = http.createServer(app);

// ── Socket.IO (must init before routes) ───────────────────────
const io = initSocket(httpServer);
// Make io available on app for any middleware that may need it
app.set("io", io);

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Security middleware ────────────────────────────────────────
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

// ── Tasks (includes /status + /attachments) ───────────────────
const taskRoutes = require("./routes/taskRoutes");
app.use("/api/tasks", taskRoutes);

// ── Task Attachments (Cloudinary upload/delete) ───────────────
const attachmentRoutes = require("./routes/attachmentRoutes");
app.use("/api/tasks", attachmentRoutes);

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

// ── Code Snippets ──────────────────────────────────────────────
const snippetRoutes = require("./routes/snippetRoutes");
app.use("/api/snippets", snippetRoutes);

// ── Global Search ─────────────────────────────────────────────
const searchRoutes = require("./routes/searchRoutes");
app.use("/api/search", searchRoutes);

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`[server] Running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please kill the process using it or use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});