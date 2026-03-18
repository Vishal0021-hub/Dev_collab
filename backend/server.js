require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

const PORT = 5000;

const ConnectDB = require("./config/db")
ConnectDB();

const authRoutes= require("./routes/authRoutes");
app.use("/api/auth",authRoutes);

const { protect } = require("./middelware/authmiddleware");

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

const workspaceRoutes = require("./routes/workspaceRoutes");

app.use("/api/workspaces", workspaceRoutes);

const projectRoutes = require("./routes/projectRoutes");

app.use("/api/projects", projectRoutes);

const boardRoutes = require("./routes/boardRoutes");

app.use("/api/boards", boardRoutes);

const taskRoutes = require("./routes/taskRoutes");

app.use("/api/tasks", taskRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});