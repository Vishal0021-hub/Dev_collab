const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  moveTask,
  deleteTask,
  assignTask,
} = require("../controllers/taskController");

const { protect } = require("../middleware/authmiddleware");
const { isMember, isAdmin } = require("../middleware/roleMiddleware");

// create task - Owner, Admin, Member can create
router.post("/", protect, isMember, createTask);

// get tasks - Any member can view
router.get("/:boardId", protect, isMember, getTasks);

// update task - Owner, Admin, Member can update
router.put("/:taskId", protect, isMember, updateTask);

// move task - Owner, Admin, Member can move
router.put("/move/:taskId", protect, isMember, moveTask);

// delete task - Only Owner and Admin
router.delete("/:taskId", protect, isAdmin, deleteTask);

// assign task - Only Owner and Admin
router.put("/:taskId/assign", protect, isAdmin, assignTask);

module.exports = router;