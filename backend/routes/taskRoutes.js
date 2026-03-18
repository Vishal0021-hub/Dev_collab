const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  updateTask,
  moveTask
} = require("../controllers/taskController");

const { protect } = require("../middelware/authmiddleware");

// create task
router.post("/", protect, createTask);

// get tasks
router.get("/:boardId", protect, getTasks);

// update task
router.put("/:taskId", protect, updateTask);

// move task
router.put("/move/:taskId", protect, moveTask);

module.exports = router;