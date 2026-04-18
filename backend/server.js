require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DevSpace API running");
});

const PORT = process.env.PORT || 5000;

const ConnectDB = require("./config/db");
ConnectDB();

// Verify SMTP connection on startup
const { verifySmtp } = require("./utils/emailService");
verifySmtp();

const { protect } = require("./middleware/authmiddleware");

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});