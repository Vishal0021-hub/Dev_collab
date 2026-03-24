const express = require("express");
const router = express.Router();

const {
  createBoard,
  getBoards
} = require("../controllers/boardController");

const { protect } = require("../middleware/authmiddleware");

// create board
router.post("/", protect, createBoard);

// get all boards
router.get("/", protect, getBoards);

// get boards by project
router.get("/:projectId", protect, getBoards);

module.exports = router;