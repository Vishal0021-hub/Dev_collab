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

// create task - Any member can create
router.post("/", protect, isMember, createTask);

// get tasks by board - Any member can view
router.get("/:boardId", protect, isMember, getTasks);

// update task metadata - Any member can update
router.put("/:taskId", protect, isMember, updateTask);

// move task to another board
router.put("/move/:taskId", protect, isMember, moveTask);

// delete task - Only Owner and Admin
router.delete("/:taskId", protect, isAdmin, deleteTask);

// assign task - Owner and Admin only
router.put("/:taskId/assign", protect, isAdmin, assignTask);

// update task status (todo | inprogress | review | done) - Any member can update status
router.patch("/:taskId/status", protect, isMember, updateTaskStatus);

module.exports = router;