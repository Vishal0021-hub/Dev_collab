const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks
} = require("../controllers/taskController");

const { protect } = require("../middelware/authmiddleware");

// create task
router.post("/", protect, createTask);

// get tasks by board
router.get("/:boardId", protect, getTasks);

module.exports = router;