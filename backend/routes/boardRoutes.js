const express = require("express");
const router = express.Router();

const {
  createBoard,
  getBoards,
  deleteBoard
} = require("../controllers/boardController");

const { protect } = require("../middleware/authmiddleware");
const { isMember, isAdmin } = require("../middleware/roleMiddleware");

// create board
router.post("/", protect, isAdmin, createBoard);

// get all boards
router.get("/", protect, isMember, getBoards);

// get boards by project
router.get("/:projectId", protect, isMember, getBoards);

// delete board
router.delete("/:boardId", protect, isAdmin, deleteBoard);

module.exports = router;