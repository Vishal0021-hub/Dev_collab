const express = require("express");
const router = express.Router();

const {
  createBoard,
  getBoards,
  deleteBoard
} = require("../controllers/boardController");

const { protect } = require("../middleware/authmiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");

// GET boards by project — just auth, no membership check needed (data scoped by projectId)
router.get("/:projectId", protect, getBoards);

// CREATE board — admin/owner only
router.post("/", protect, isAdmin, createBoard);

// DELETE board — admin/owner only
router.delete("/:boardId", protect, isAdmin, deleteBoard);

module.exports = router;