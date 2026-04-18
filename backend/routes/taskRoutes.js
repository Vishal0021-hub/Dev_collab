const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
  assignTask,
  updateTaskStatus
} = require("../controllers/taskController");

const { protect } = require("../middleware/authmiddleware");
const { isMember, isAdmin } = require("../middleware/roleMiddleware");

// ── Specific prefix routes BEFORE generic /:id routes ──────────

// Move task — has explicit /move/ prefix — safe before /:taskId
router.put("/move/:taskId", protect, moveTask);

// GET tasks by board — just auth (data scoped by boardId)
router.get("/board/:boardId", protect, getTasks);

// Update status — specific suffix
router.patch("/:taskId/status", protect, isMember, updateTaskStatus);

// Assign task — specific suffix, admin only
router.put("/:taskId/assign", protect, isAdmin, assignTask);

// Create task — body has boardId, isMember resolves workspace from boardId
router.post("/", protect, isMember, createTask);

// Update task metadata
router.put("/:taskId", protect, updateTask);

// Delete task
router.delete("/:taskId", protect, isAdmin, deleteTask);

module.exports = router;