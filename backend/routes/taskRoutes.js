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
const { authorize } = require("../middleware/roleMiddleware");

// create task - Owner, Admin, Member can create
router.post("/", protect, authorize(["owner", "admin", "member"]), createTask);

// get tasks - Any member can view
router.get("/:boardId", protect, authorize(["owner", "admin", "member"]), getTasks);

// update task - Owner, Admin, Member can update
router.put("/:taskId", protect, authorize(["owner", "admin", "member"]), updateTask);

// move task - Owner, Admin, Member can move
router.put("/move/:taskId", protect, authorize(["owner", "admin", "member"]), moveTask);

// delete task - Only Owner and Admin
router.delete("/:taskId", protect, authorize(["owner", "admin"]), deleteTask);

// assign task - Only Owner and Admin
router.put("/:taskId/assign", protect, authorize(["owner", "admin"]), assignTask);

module.exports = router;